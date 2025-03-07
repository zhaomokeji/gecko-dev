// This file supports translating W3C tests
// to tests on auto MochiTest system with minimum changes.
// Author: Maksim Lebedev <alessarik@gmail.com>

// Function allows to prepare our tests after load document
addEventListener("load", function(event) {
  console.log("OnLoad external document");
  prepareTest();
}, false);

// Function allows to initialize prerequisites before testing
function prepareTest() {
  SimpleTest.waitForExplicitFinish();
  SimpleTest.requestCompleteLog();
  turnOnPointerEvents(startTest);
}

function setImplicitPointerCapture(capture, callback) {
  console.log("SET dom.w3c_pointer_events.implicit_capture as " + capture);
  SpecialPowers.pushPrefEnv({
    "set": [
      ["dom.w3c_pointer_events.implicit_capture", capture]
    ]
  }, callback);
}

function turnOnPointerEvents(callback) {
  console.log("SET dom.w3c_pointer_events.enabled as TRUE");
  console.log("SET layout.css.touch_action.enabled as TRUE");
  SpecialPowers.pushPrefEnv({
    "set": [
      ["dom.w3c_pointer_events.enabled", true],
      ["layout.css.touch_action.enabled", true]
    ]
  }, callback);
}

// Mouse Event Helper Object
var MouseEventHelper = (function() {
  var utils = SpecialPowers.Ci.nsIDOMWindowUtils;

  return {
    // State
    // TODO: Separate this to support mouse and pen simultaneously.
    BUTTONS_STATE: utils.MOUSE_BUTTONS_NO_BUTTON,

    // Button
    BUTTON_NONE:   -1, // Used by test framework only. (replaced before sending)
    BUTTON_LEFT:   utils.MOUSE_BUTTON_LEFT_BUTTON,
    BUTTON_MIDDLE: utils.MOUSE_BUTTON_MIDDLE_BUTTON,
    BUTTON_RIGHT:  utils.MOUSE_BUTTON_RIGHT_BUTTON,

    // Buttons
    BUTTONS_NONE:   utils.MOUSE_BUTTONS_NO_BUTTON,
    BUTTONS_LEFT:   utils.MOUSE_BUTTONS_LEFT_BUTTON,
    BUTTONS_MIDDLE: utils.MOUSE_BUTTONS_MIDDLE_BUTTON,
    BUTTONS_RIGHT:  utils.MOUSE_BUTTONS_RIGHT_BUTTON,
    BUTTONS_4TH:    utils.MOUSE_BUTTONS_4TH_BUTTON,
    BUTTONS_5TH:    utils.MOUSE_BUTTONS_5TH_BUTTON,

    // Utils
    computeButtonsMaskFromButton: function(aButton) {
      // Since the range of button values is 0 ~ 2 (see nsIDOMWindowUtils.idl),
      // we can use an array to find out the desired mask.
      var mask = [
        this.BUTTONS_NONE,   // -1 (MouseEventHelper.BUTTON_NONE)
        this.BUTTONS_LEFT,   // 0
        this.BUTTONS_MIDDLE, // 1
        this.BUTTONS_RIGHT   // 2
      ][aButton + 1];

      ok(mask !== undefined, "Unrecognized button value caught!");
      return mask;
    },

    checkExitState: function() {
      ok(!this.BUTTONS_STATE, "Mismatched mousedown/mouseup caught.");
    }
  };
}) ();

// Helper function to send MouseEvent with different parameters
function sendMouseEvent(int_win, elemId, mouseEventType, params) {
  var elem = int_win.document.getElementById(elemId);
  if(!!elem) {
    var rect = elem.getBoundingClientRect();
    var eventObj = {type: mouseEventType};

    if(params && "inputSource" in params)
      eventObj.inputSource = params.inputSource;

    // Check or generate a |button| value.
    var isButtonEvent = mouseEventType === "mouseup" ||
                        mouseEventType === "mousedown";

    // Set |button| to the default value first.
    eventObj.button = isButtonEvent ? MouseEventHelper.BUTTON_LEFT
                                    : MouseEventHelper.BUTTON_NONE;

    // |button| is passed, use and check it.
    if (params && "button" in params) {
      var hasButtonValue = (params.button !== MouseEventHelper.BUTTON_NONE);
      ok(!isButtonEvent || hasButtonValue,
         "Inappropriate |button| value caught.");
      eventObj.button = params.button;
    }

    // Generate a |buttons| value and update buttons state
    var buttonsMask = MouseEventHelper.computeButtonsMaskFromButton(eventObj.button);
    switch(mouseEventType) {
      case "mousedown":
        MouseEventHelper.BUTTONS_STATE |= buttonsMask; // Set button flag.
        break;
      case "mouseup":
        MouseEventHelper.BUTTONS_STATE &= ~buttonsMask; // Clear button flag.
        break;
    }
    eventObj.buttons = MouseEventHelper.BUTTONS_STATE;

    // Replace the button value for mousemove events.
    // Since in widget level design, even when no button is pressed at all, the
    // value of WidgetMouseEvent.button is still 0, which is the same value as
    // the one for mouse left button.
    if (mouseEventType === "mousemove") {
      eventObj.button = MouseEventHelper.BUTTON_LEFT;
    }

    // Default to the center of the target element but we can still send to a
    // position outside of the target element.
    var offsetX = params && "offsetX" in params ? params.offsetX : rect.width / 2;
    var offsetY = params && "offsetY" in params ? params.offsetY : rect.height / 2;

    console.log(elemId, eventObj);
    synthesizeMouse(elem, offsetX, offsetY, eventObj, int_win);

  } else {
    is(!!elem, true, "Document should have element with id: " + elemId);
  }
}

// Touch Event Helper Object
var TouchEventHelper = {
  // State
  // TODO: Support multiple point scenarios.
  TOUCH_STATE: false,

  // Utils
  checkExitState: function() {
    ok(!this.TOUCH_STATE, "Mismatched touchstart/touchend caught.");
  }
}

// Helper function to send TouchEvent with different parameters
function sendTouchEvent(int_win, elemId, touchEventType, params) {
  var elem = int_win.document.getElementById(elemId);
  if(!!elem) {
    var rect = elem.getBoundingClientRect();
    var eventObj = {type: touchEventType};

    // Update touch state
    switch(touchEventType) {
      case "touchstart":
        TouchEventHelper.TOUCH_STATE = true; // Set touch flag.
        break;
      case "touchend":
        TouchEventHelper.TOUCH_STATE = false; // Clear touch flag.
        break;
    }

    // Default to the center of the target element but we can still send to a
    // position outside of the target element.
    var offsetX = params && "offsetX" in params ? params.offsetX : rect.width / 2;
    var offsetY = params && "offsetY" in params ? params.offsetY : rect.height / 2;

    console.log(elemId, eventObj);
    synthesizeTouch(elem, offsetX, offsetY, eventObj, int_win);
  } else {
    is(!!elem, true, "Document should have element with id: " + elemId);
  }
}

// Helper function to run Point Event test in a new tab.
function runTestInNewWindow(aFile) {
  var testURL = location.href.substring(0, location.href.lastIndexOf('/') + 1) + aFile;
  var testWindow = window.open(testURL, "_blank");

  window.addEventListener("message", function(aEvent) {
    switch(aEvent.data.type) {
      case "START":
        turnOnPointerEvents(() => {
          executeTest(testWindow);
        });
        return;
      case "RESULT":
        ok(aEvent.data.result, aEvent.data.message);
        return;
      case "FIN":
        MouseEventHelper.checkExitState();
        TouchEventHelper.checkExitState();
        testWindow.close();
        SimpleTest.finish();
        return;
    }
  });
}
