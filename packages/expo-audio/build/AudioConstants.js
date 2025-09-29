// @needsAudit
/**
 * An enum whose values control which of the pre-defined buttons are displayed on the lock screen
 */
export var LockScreenButton;
(function (LockScreenButton) {
    /**
     * "Play/Pause" toggle button
     */
    LockScreenButton[LockScreenButton["PLAY_PAUSE"] = 0] = "PLAY_PAUSE";
    /**
     * Forward button
     */
    LockScreenButton[LockScreenButton["FORWARD"] = 1] = "FORWARD";
    /**
     * Backward button
     */
    LockScreenButton[LockScreenButton["BACKWARD"] = 2] = "BACKWARD";
    /**
     * Next track button
     */
    LockScreenButton[LockScreenButton["NEXT"] = 3] = "NEXT";
    /**
     * Previous track button
     */
    LockScreenButton[LockScreenButton["PREVIOUS"] = 4] = "PREVIOUS";
})(LockScreenButton || (LockScreenButton = {}));
//# sourceMappingURL=AudioConstants.js.map