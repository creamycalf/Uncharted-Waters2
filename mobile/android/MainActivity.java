package org.local.uw2mobile.inputtest;

import android.app.Activity;
import android.content.Intent;
import android.content.ClipData;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.hardware.input.InputManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
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
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public final class MainActivity extends Activity implements InputManager.InputDeviceListener {
    private WebView web;
    private InputManager inputManager;
    private volatile boolean textInputFocused;
    private static final int TRANSFER_EXPORT = 7401, TRANSFER_IMPORT = 7402, MAX_TRANSFER_BYTES = 700000;
    private String pendingTransferExport;
    private boolean transferPickerOpen;
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

    private void transferResult(String kind, String status, String payload) {
        runOnUiThread(() -> {
            if (web != null) web.evaluateJavascript("window.K2SaveTransfer?.nativeResult("
                    + JSONObject.quote(kind) + "," + JSONObject.quote(status) + ","
                    + JSONObject.quote(payload == null ? "" : payload) + ")", null);
        });
    }

    // BEGIN save naming helpers: also exercised independently by save-names.test.cjs.
    private static String saveFileName(Date when, int duplicate) {
        String stamp = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(when);
        String suffix = duplicate == 0 ? "" : String.format(Locale.US, "-%02d", duplicate);
        return "UW2-" + stamp + suffix + ".uw2save.json";
    }

    private static boolean isSharedSaveName(String name) {
        return name != null && name.matches("UW2-(?:[0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2}-[0-9]{2}-[0-9]{2}(?:-[0-9]{2})?|[0-9]{8}-[0-9]{6}-[a-f0-9]{32})\\.uw2save\\.json");
    }

    private static File reserveShareFile(File dir, Date when) throws IOException {
        for (int duplicate = 0; duplicate < 100; duplicate++) {
            File candidate = new File(dir, saveFileName(when, duplicate));
            if (candidate.createNewFile()) return candidate;
        }
        throw new IOException("同一秒内的分享文件过多，请稍后重试");
    }
    // END save naming helpers.

    // Shares only explicitly selected save snapshots, never arbitrary application files.
    public static final class SaveShareProvider extends ContentProvider {
        private File sharedFile(Uri uri) throws FileNotFoundException {
            if (getContext() == null || uri.getPathSegments().size() != 1) throw new FileNotFoundException();
            String name = uri.getLastPathSegment();
            if (!isSharedSaveName(name)) throw new FileNotFoundException();
            File file = new File(new File(getContext().getCacheDir(), "save-share"), name);
            if (!file.isFile()) throw new FileNotFoundException();
            return file;
        }
        @Override public boolean onCreate() { return true; }
        @Override public String getType(Uri uri) { return "application/json"; }
        @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
            if (!"r".equals(mode)) throw new FileNotFoundException();
            return ParcelFileDescriptor.open(sharedFile(uri), ParcelFileDescriptor.MODE_READ_ONLY);
        }
        @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sortOrder) {
            try {
                File file = sharedFile(uri);
                String[] cols = projection == null ? new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : projection;
                MatrixCursor cursor = new MatrixCursor(cols);
                Object[] row = new Object[cols.length];
                for (int i = 0; i < cols.length; i++) {
                    if (OpenableColumns.DISPLAY_NAME.equals(cols[i])) row[i] = file.getName();
                    else if (OpenableColumns.SIZE.equals(cols[i])) row[i] = file.length();
                }
                cursor.addRow(row); return cursor;
            } catch (FileNotFoundException error) { return null; }
        }
        @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
        @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
        @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
    }

    private void shareSave(String content) {
        if (content == null || content.length() > MAX_TRANSFER_BYTES) { transferResult("share", "error", "存档文件大小不符"); return; }
        new Thread(() -> {
            try {
                File dir = new File(getCacheDir(), "save-share");
                if (!dir.isDirectory() && !dir.mkdirs()) throw new IOException("无法准备分享文件");
                File file = reserveShareFile(dir, new Date());
                try (FileOutputStream out = new FileOutputStream(file)) { out.write(content.getBytes(StandardCharsets.UTF_8)); out.getFD().sync(); }
                catch (IOException error) { file.delete(); throw error; }
                Uri uri = new Uri.Builder().scheme("content").authority(getPackageName() + ".save-share").appendPath(file.getName()).build();
                runOnUiThread(() -> {
                    try {
                        Intent send = new Intent(Intent.ACTION_SEND);
                        send.setType("application/json"); send.putExtra(Intent.EXTRA_STREAM, uri);
                        send.setClipData(ClipData.newRawUri("航海存档", uri)); send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        Intent chooser = Intent.createChooser(send, "选择 123 云盘或其他应用");
                        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); chooser.setClipData(send.getClipData());
                        startActivity(chooser); transferResult("share", "ok", "");
                    } catch (Exception error) { transferResult("share", "error", "无法打开系统分享界面"); }
                });
            } catch (Exception error) { transferResult("share", "error", "无法准备分享文件，请重试"); }
        }, "uw2-save-share").start();
    }

    private void openTransferPicker(boolean exporting, String content) {
        if (transferPickerOpen) { transferResult(exporting ? "export" : "import", "error", "文件选择器已打开"); return; }
        if (exporting && (content == null || content.length() > MAX_TRANSFER_BYTES)) {
            transferResult("export", "error", "导出内容大小不符"); return;
        }
        try {
            Intent intent = new Intent(exporting ? Intent.ACTION_CREATE_DOCUMENT : Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(exporting ? "application/json" : "*/*");
            if (exporting) intent.putExtra(Intent.EXTRA_TITLE, saveFileName(new Date(), 0));
            pendingTransferExport = exporting ? content : null;
            transferPickerOpen = true;
            startActivityForResult(intent, exporting ? TRANSFER_EXPORT : TRANSFER_IMPORT);
        } catch (Exception error) {
            transferPickerOpen = false; pendingTransferExport = null;
            transferResult(exporting ? "export" : "import", "error", "无法打开系统文件选择器");
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent result) {
        super.onActivityResult(requestCode, resultCode, result);
        if (requestCode != TRANSFER_EXPORT && requestCode != TRANSFER_IMPORT) return;
        final boolean exporting = requestCode == TRANSFER_EXPORT;
        final String payload = pendingTransferExport;
        pendingTransferExport = null; transferPickerOpen = false;
        final String kind = exporting ? "export" : "import";
        final Uri uri = result == null ? null : result.getData();
        if (resultCode != RESULT_OK || uri == null) { transferResult(kind, "cancelled", ""); return; }
        if (exporting && payload == null) { transferResult(kind, "error", "导出已中断，请重试"); return; }
        new Thread(() -> {
            try {
                if (exporting) {
                    try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                        if (out == null) throw new IOException("无法写入文件");
                        out.write(payload.getBytes(StandardCharsets.UTF_8)); out.flush();
                    }
                    transferResult(kind, "ok", "");
                } else {
                    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                    try (InputStream in = getContentResolver().openInputStream(uri)) {
                        if (in == null) throw new IOException("无法读取文件");
                        byte[] buffer = new byte[8192]; int count;
                        while ((count = in.read(buffer)) != -1) {
                            if (bytes.size() + count > MAX_TRANSFER_BYTES) throw new IOException("文件太大");
                            bytes.write(buffer, 0, count);
                        }
                    }
                    transferResult(kind, "ok", new String(bytes.toByteArray(), StandardCharsets.UTF_8));
                }
            } catch (Exception error) { transferResult(kind, "error", exporting ? "文件写入失败，请检查存储位置" : "文件读取失败或文件太大"); }
        }, "uw2-save-transfer").start();
    }

    public final class Bridge {
        @android.webkit.JavascriptInterface
        public void shareSave(String content) { MainActivity.this.shareSave(content); }
        @android.webkit.JavascriptInterface
        public void exportSave(String content) { runOnUiThread(() -> openTransferPicker(true, content)); }

        @android.webkit.JavascriptInterface
        public void importSave() { runOnUiThread(() -> openTransferPicker(false, null)); }

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
