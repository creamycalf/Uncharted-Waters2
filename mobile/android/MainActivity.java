package org.local.uw2mobile.inputtest;

import android.app.Activity;
import android.hardware.input.InputManager;
import android.os.Bundle;
import android.os.Handler;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class MainActivity extends Activity implements InputManager.InputDeviceListener {
    private WebView web;
    private InputManager inputManager;
    private volatile boolean textInputFocused;
    private final Map<Integer, TriggerState> triggerStates = new HashMap<>();

    private static final class TriggerState {
        boolean leftKey;
        boolean leftAxis;
        boolean rightKey;
        boolean rightAxis;

        boolean leftPressed() { return leftKey || leftAxis; }
        boolean rightPressed() { return rightKey || rightAxis; }
        boolean isEmpty() { return !leftPressed() && !rightPressed(); }
    }

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(5894);

        web = new WebView(this);
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !"appassets.androidplatform.net".equals(request.getUrl().getHost());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (!"appassets.androidplatform.net".equals(request.getUrl().getHost())) {
                    return emptyResponse();
                }
                String path = request.getUrl().getPath();
                if (path == null || path.contains("..")) return emptyResponse();
                if (path.equals("/")) path = "/web/index.html";
                try {
                    return new WebResourceResponse(mimeType(path), "UTF-8", getAssets().open(path.substring(1)));
                } catch (IOException error) {
                    return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found",
                            Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                }
            }
        });
        web.loadUrl("https://appassets.androidplatform.net/web/index.html");

        inputManager = (InputManager) getSystemService(INPUT_SERVICE);
        if (inputManager != null) inputManager.registerInputDeviceListener(this, new Handler(getMainLooper()));
    }

    private static String mimeType(String path) {
        if (path.endsWith(".html")) return "text/html";
        if (path.endsWith(".js")) return "application/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".wasm")) return "application/wasm";
        if (path.endsWith(".webp")) return "image/webp";
        if (path.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

    private static WebResourceResponse emptyResponse() {
        return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
    }

    private boolean isController(KeyEvent event) {
        return event.isFromSource(InputDevice.SOURCE_GAMEPAD)
                || event.isFromSource(InputDevice.SOURCE_DPAD)
                || event.isFromSource(InputDevice.SOURCE_JOYSTICK);
    }

    private static String actionFor(KeyEvent event, boolean controller) {
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_DPAD_UP: return "up";
            case KeyEvent.KEYCODE_DPAD_DOWN: return "down";
            case KeyEvent.KEYCODE_DPAD_LEFT: return "left";
            case KeyEvent.KEYCODE_DPAD_RIGHT: return "right";
            case KeyEvent.KEYCODE_DPAD_CENTER: return "confirm";
            case KeyEvent.KEYCODE_W: return "up";
            case KeyEvent.KEYCODE_S: return "down";
            case KeyEvent.KEYCODE_A: return "left";
            case KeyEvent.KEYCODE_D: return "right";
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER:
            case KeyEvent.KEYCODE_SPACE: return "confirm";
            case KeyEvent.KEYCODE_ESCAPE:
            case KeyEvent.KEYCODE_DEL: return "back";
            case KeyEvent.KEYCODE_M:
            case KeyEvent.KEYCODE_MENU: return "tools";
            case KeyEvent.KEYCODE_F1: return "menu";
            default:
                if (!controller) return null;
                switch (event.getKeyCode()) {
                    case KeyEvent.KEYCODE_BUTTON_A: return "confirm";
                    case KeyEvent.KEYCODE_BUTTON_B: return "back";
                    case KeyEvent.KEYCODE_BUTTON_X: return "mouse-left";
                    case KeyEvent.KEYCODE_BUTTON_Y: return "mouse-right";
                    case KeyEvent.KEYCODE_BUTTON_L1: return "shortcut-info";
                    case KeyEvent.KEYCODE_BUTTON_R1: return "shortcut-command";
                    case KeyEvent.KEYCODE_BUTTON_START: return "tools";
                    case KeyEvent.KEYCODE_BUTTON_SELECT: return "menu";
                    default: return null;
                }
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        boolean controller = isController(event);
        if (textInputFocused) return super.dispatchKeyEvent(event);

        int keyCode = event.getKeyCode();
        if (controller && (keyCode == KeyEvent.KEYCODE_BUTTON_L2
                || keyCode == KeyEvent.KEYCODE_BUTTON_R2)) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                updateTriggerInput(event.getDeviceId(), keyCode == KeyEvent.KEYCODE_BUTTON_L2, false, true);
                return true;
            }
            if (event.getAction() == KeyEvent.ACTION_UP) {
                updateTriggerInput(event.getDeviceId(), keyCode == KeyEvent.KEYCODE_BUTTON_L2, false, false);
                return true;
            }
            return event.getAction() == KeyEvent.ACTION_DOWN;
        }

        String action = actionFor(event, controller);
        if (action == null) return super.dispatchKeyEvent(event);

        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (event.getRepeatCount() == 0) sendHardwareKey(action, true, sourceName(event, controller));
            return true;
        }
        if (event.getAction() == KeyEvent.ACTION_UP) {
            sendHardwareKey(action, false, sourceName(event, controller));
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private static String sourceName(KeyEvent event, boolean controller) {
        return (controller ? "pad-" : "keyboard-") + event.getDeviceId();
    }

    private void sendHardwareKey(String action, boolean down, String source) {
        if (web == null) return;
        String script = "window.K2MobileHardware&&window.K2MobileHardware.key('" + action + "',"
                + down + ",'" + source + "')";
        web.evaluateJavascript(script, null);
    }

    private void sendHardwareAxes(String source, float x, float y, float hatX, float hatY,
                                  float rightX, float rightY) {
        if (web == null) return;
        String script = "window.K2MobileHardware&&window.K2MobileHardware.axes('" + source + "',"
                + jsNumber(x) + "," + jsNumber(y) + "," + jsNumber(hatX) + "," + jsNumber(hatY)
                + "," + jsNumber(rightX) + "," + jsNumber(rightY) + ")";
        web.evaluateJavascript(script, null);
    }

    private static String jsNumber(float value) {
        return Float.isFinite(value) ? Float.toString(value) : "0";
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        boolean controller = event.isFromSource(InputDevice.SOURCE_JOYSTICK)
                || event.isFromSource(InputDevice.SOURCE_GAMEPAD);
        if (!controller || textInputFocused || event.getAction() != MotionEvent.ACTION_MOVE) {
            return super.dispatchGenericMotionEvent(event);
        }
        String source = "pad-" + event.getDeviceId();
        sendHardwareAxes(source,
                event.getAxisValue(MotionEvent.AXIS_X),
                event.getAxisValue(MotionEvent.AXIS_Y),
                event.getAxisValue(MotionEvent.AXIS_HAT_X),
                event.getAxisValue(MotionEvent.AXIS_HAT_Y),
                event.getAxisValue(MotionEvent.AXIS_Z),
                event.getAxisValue(MotionEvent.AXIS_RZ));
        updateTriggerAxis(event.getDeviceId(), true,
                triggerValue(event, MotionEvent.AXIS_LTRIGGER, MotionEvent.AXIS_BRAKE));
        updateTriggerAxis(event.getDeviceId(), false,
                triggerValue(event, MotionEvent.AXIS_RTRIGGER, MotionEvent.AXIS_GAS));
        return true;
    }

    private static float triggerValue(MotionEvent event, int primaryAxis, int fallbackAxis) {
        return Math.max(event.getAxisValue(primaryAxis), event.getAxisValue(fallbackAxis));
    }

    private void updateTriggerAxis(int deviceId, boolean left, float value) {
        TriggerState current = triggerStates.get(deviceId);
        boolean wasPressed = current != null && (left ? current.leftAxis : current.rightAxis);
        boolean pressed = Float.isFinite(value) && (wasPressed ? value > 0.35f : value >= 0.55f);
        updateTriggerInput(deviceId, left, true, pressed);
    }

    private void updateTriggerInput(int deviceId, boolean left, boolean analog, boolean pressed) {
        TriggerState state = triggerStates.get(deviceId);
        if (state == null) {
            if (!pressed) return;
            state = new TriggerState();
            triggerStates.put(deviceId, state);
        }
        boolean wasPressed = left ? state.leftPressed() : state.rightPressed();
        if (left) {
            if (analog) state.leftAxis = pressed;
            else state.leftKey = pressed;
        } else {
            if (analog) state.rightAxis = pressed;
            else state.rightKey = pressed;
        }
        boolean isPressed = left ? state.leftPressed() : state.rightPressed();
        if (wasPressed != isPressed) {
            sendHardwareKey(left ? "shortcut-trade" : "shortcut-sailing", isPressed, "pad-" + deviceId);
        }
        if (state.isEmpty()) triggerStates.remove(deviceId);
    }

    private void resetHardwareInput() {
        triggerStates.clear();
        if (web != null) web.evaluateJavascript("window.K2MobileHardware?.resetAll();window.K2Mobile?.cancel()", null);
    }

    @Override
    public void onBackPressed() {
        if (web != null) {
            web.evaluateJavascript("window.K2MobileHardware?window.K2MobileHardware.systemBack():(!window.__ci?Android.exit():window.K2Mobile?.state().panel?window.K2Mobile.close():window.K2Mobile?.state().deck?window.K2Mobile.closeDeck():window.K2UI?.back())", null);
        }
    }

    @Override
    protected void onPause() {
        resetHardwareInput();
        if (web != null) web.evaluateJavascript("window.K2Lifecycle?.background()", null);
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.evaluateJavascript("window.K2Lifecycle?.foreground()", null);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) resetHardwareInput();
    }

    @Override
    public void onInputDeviceAdded(int deviceId) { }

    @Override
    public void onInputDeviceChanged(int deviceId) { }

    @Override
    public void onInputDeviceRemoved(int deviceId) {
        resetHardwareInput();
    }

    @Override
    protected void onDestroy() {
        if (inputManager != null) inputManager.unregisterInputDeviceListener(this);
        if (web != null) {
            web.removeJavascriptInterface("Android");
            web.destroy();
        }
        super.onDestroy();
    }

    public final class Bridge {
        @android.webkit.JavascriptInterface
        public void exit() {
            runOnUiThread(() -> finish());
        }

        @android.webkit.JavascriptInterface
        public void setTextInputFocused(boolean focused) {
            textInputFocused = focused;
        }
    }
}
