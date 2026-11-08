(function (root) {
  'use strict';

  const directionActions = new Set(['up', 'down', 'left', 'right']);
  const tabShortcuts = new Map([
    ['shortcut-info', 0],
    ['shortcut-trade', 1],
    ['shortcut-command', 2],
    ['shortcut-sailing', 3]
  ]);
  const buttonActions = new Set([
    'confirm', 'back', 'mouse-left', 'mouse-right', 'tools', 'menu', ...tabShortcuts.keys()
  ]);
  const browserKeys = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    Enter: 'confirm', NumpadEnter: 'confirm', Space: 'confirm',
    Escape: 'back', Backspace: 'back',
    KeyM: 'tools', F1: 'menu'
  };
  const devices = new Map();
  const capturedNumericKeys = new Set();
  const DEAD_ZONE = 0.22;
  let pointerFrame = 0;
  let lastPointerAt = 0;

  function clamp(value) {
    return Math.max(-1, Math.min(1, value));
  }

  function shapeAxis(value) {
    const magnitude = Math.abs(value);
    if (!Number.isFinite(value) || magnitude <= DEAD_ZONE) return 0;
    return Math.sign(value) * (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
  }

  function sourceState(source) {
    const name = String(source || 'keyboard');
    if (!devices.has(name)) {
      devices.set(name, {
        keys: new Set(),
        buttons: new Set(),
        axes: { x: 0, y: 0, hatX: 0, hatY: 0, rightX: 0, rightY: 0 }
      });
    }
    return devices.get(name);
  }

  function directionVector() {
    let x = 0;
    let y = 0;
    for (const state of devices.values()) {
      if (state.keys.has('left')) x -= 1;
      if (state.keys.has('right')) x += 1;
      if (state.keys.has('up')) y -= 1;
      if (state.keys.has('down')) y += 1;
      x += shapeAxis(state.axes.x);
      y += shapeAxis(state.axes.y);
      if (state.axes.hatX < -0.5) x -= 1;
      if (state.axes.hatX > 0.5) x += 1;
      if (state.axes.hatY < -0.5) y -= 1;
      if (state.axes.hatY > 0.5) y += 1;
    }
    return { x: clamp(x), y: clamp(y) };
  }

  function pointerVector() {
    let x = 0;
    let y = 0;
    for (const state of devices.values()) {
      x += shapeAxis(state.axes.rightX);
      y += shapeAxis(state.axes.rightY);
    }
    return { x: clamp(x), y: clamp(y) };
  }

  function dispatchDirection() {
    const vector = directionVector();
    root.K2Mobile?.hardwareDirection(vector.x, vector.y);
  }

  function stopPointerLoop() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    lastPointerAt = 0;
    root.K2Mobile?.hardwarePointer(0, 0, 0);
  }

  function runPointerLoop(now) {
    pointerFrame = 0;
    const vector = pointerVector();
    if (Math.hypot(vector.x, vector.y) < 0.03) {
      lastPointerAt = 0;
      return;
    }
    const elapsed = lastPointerAt ? Math.min(50, now - lastPointerAt) : 16;
    lastPointerAt = now;
    root.K2Mobile?.hardwarePointer(vector.x, vector.y, elapsed);
    pointerFrame = requestAnimationFrame(runPointerLoop);
  }

  function updatePointerLoop() {
    const vector = pointerVector();
    if (Math.hypot(vector.x, vector.y) < 0.03) {
      stopPointerLoop();
    } else if (!pointerFrame) {
      pointerFrame = requestAnimationFrame(runPointerLoop);
    }
  }

  function key(action, down, source) {
    if (!directionActions.has(action) && !buttonActions.has(action)) return false;
    const name = String(source || 'keyboard');
    const state = down ? sourceState(name) : devices.get(name);
    if (!state) return true;
    if (directionActions.has(action)) {
      if (down) state.keys.add(action);
      else state.keys.delete(action);
      dispatchDirection();
      return true;
    }
    if (down && !state.buttons.has(action)) {
      state.buttons.add(action);
      root.K2Mobile?.hardwareAction(action);
    } else if (!down) {
      state.buttons.delete(action);
    }
    return true;
  }

  function axes(source, x, y, hatX, hatY, rightX, rightY) {
    const state = sourceState(source);
    state.axes = { x, y, hatX, hatY, rightX, rightY };
    dispatchDirection();
    updatePointerLoop();
  }

  function reset(source) {
    if (source == null) {
      devices.clear();
      capturedNumericKeys.clear();
    }
    else devices.delete(String(source));
    dispatchDirection();
    updatePointerLoop();
  }

  function isEditable(target) {
    return !!target?.closest?.('input,textarea,select,[contenteditable="true"]');
  }

  function syncTextInputFocus() {
    const active = isEditable(root.document?.activeElement);
    try {
      root.Android?.setTextInputFocused?.(active);
    } catch (_) {
      // Browser previews do not expose the Android bridge.
    }
  }

  function browserKey(event, down) {
    const digit = /^(?:Digit|Numpad)([0-9])$/.exec(event.code);
    if (digit && !isEditable(event.target)) {
      const alreadyCaptured = capturedNumericKeys.has(event.code);
      if (down && (alreadyCaptured || root.K2Input?.state()?.numeric)) {
        capturedNumericKeys.add(event.code);
        if (!event.repeat && !alreadyCaptured) root.K2Input.key(digit[1].charCodeAt(0));
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (!down && alreadyCaptured) {
        capturedNumericKeys.delete(event.code);
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
    }
    const action = browserKeys[event.code];
    if (!action) return;
    if (isEditable(event.target)) {
      if (!down) key(action, false, 'browser-keyboard');
      return;
    }
    key(action, down, 'browser-keyboard');
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  if (root.document) {
    root.document.addEventListener('keydown', event => browserKey(event, true), true);
    root.document.addEventListener('keyup', event => browserKey(event, false), true);
    root.document.addEventListener('focusin', syncTextInputFocus, true);
    root.document.addEventListener('focusout', () => setTimeout(syncTextInputFocus, 0), true);
    root.document.addEventListener('visibilitychange', () => {
      if (root.document.hidden) reset();
    });
  }
  root.addEventListener?.('blur', () => reset());

  root.K2MobileHardware = {
    key,
    axes,
    reset,
    resetAll: () => reset(),
    systemBack: () => {
      if (!root.__ci) root.Android?.exit?.();
      else root.K2Mobile?.hardwareAction('back');
    },
    state: () => ({ devices: devices.size, pointerActive: !!pointerFrame })
  };
  syncTextInputFocus();
})(typeof window === 'undefined' ? globalThis : window);
