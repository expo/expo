/**
 * Defines the slots in which custom buttons can be displayed in the now playing notification and lock screen controls.
 * @platform android
 */
export var NowPlayingActionSlot;
(function (NowPlayingActionSlot) {
    /** A central slot in a playback control UI, most commonly used for play or pause actions. */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_CENTRAL"] = 1] = "SLOT_CENTRAL";
    /**
     * A slot in a playback control UI for backward-directed playback actions, most commonly used for
     * previous or rewind actions.
     */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_BACK"] = 2] = "SLOT_BACK";
    /**
     * A slot in a playback control UI for forward-directed playback actions, most commonly used for
     * next or fast-forward actions.
     */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_FORWARD"] = 3] = "SLOT_FORWARD";
    /**
     * A slot in a playback control UI for secondary backward-directed playback actions, most commonly
     * used for previous or rewind actions.
     */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_BACK_SECONDARY"] = 4] = "SLOT_BACK_SECONDARY";
    /**
     * A slot in a playback control UI for secondary forward-directed playback actions, most commonly
     * used for next or fast-forward actions.
     */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_FORWARD_SECONDARY"] = 5] = "SLOT_FORWARD_SECONDARY";
    /** A slot in a playback control UI for additional actions that don't fit into other slots. */
    NowPlayingActionSlot[NowPlayingActionSlot["SLOT_OVERFLOW"] = 6] = "SLOT_OVERFLOW";
})(NowPlayingActionSlot || (NowPlayingActionSlot = {}));
//# sourceMappingURL=NowPlayingActionSlot.js.map