// @needsAudit
export var ResizeMode;
(function (ResizeMode) {
    /**
     * Fit within component bounds while preserving aspect ratio.
     */
    ResizeMode["CONTAIN"] = "contain";
    /**
     * Fill component bounds while preserving aspect ratio.
     */
    ResizeMode["COVER"] = "cover";
    /**
     * Stretch to fill component bounds.
     */
    ResizeMode["STRETCH"] = "stretch";
})(ResizeMode || (ResizeMode = {}));
// @needsAudit
export var VideoFullscreenUpdate;
(function (VideoFullscreenUpdate) {
    /**
     * Describing that the fullscreen player is about to present.
     */
    VideoFullscreenUpdate[VideoFullscreenUpdate["PLAYER_WILL_PRESENT"] = 0] = "PLAYER_WILL_PRESENT";
    /**
     * Describing that the fullscreen player just finished presenting.
     */
    VideoFullscreenUpdate[VideoFullscreenUpdate["PLAYER_DID_PRESENT"] = 1] = "PLAYER_DID_PRESENT";
    /**
     * Describing that the fullscreen player is about to dismiss.
     */
    VideoFullscreenUpdate[VideoFullscreenUpdate["PLAYER_WILL_DISMISS"] = 2] = "PLAYER_WILL_DISMISS";
    /**
     * Describing that the fullscreen player just finished dismissing.
     */
    VideoFullscreenUpdate[VideoFullscreenUpdate["PLAYER_DID_DISMISS"] = 3] = "PLAYER_DID_DISMISS";
})(VideoFullscreenUpdate || (VideoFullscreenUpdate = {}));
//# sourceMappingURL=Video.types.js.map