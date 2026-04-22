/**
 * Defines the slots in which custom media session buttons can be displayed in the now playing notification and lock screen controls.
 * @platform android
 */
export var NowPlayingCommandSlot;
(function (NowPlayingCommandSlot) {
    /** A central slot in a playback control UI, most commonly used for play or pause actions. */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_CENTRAL"] = 1] = "SLOT_CENTRAL";
    /**
     * A slot in a playback control UI for backward-directed playback actions, most commonly used for
     * previous or rewind actions.
     */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_BACK"] = 2] = "SLOT_BACK";
    /**
     * A slot in a playback control UI for forward-directed playback actions, most commonly used for
     * next or fast-forward actions.
     */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_FORWARD"] = 3] = "SLOT_FORWARD";
    /**
     * A slot in a playback control UI for secondary backward-directed playback actions, most commonly
     * used for previous or rewind actions.
     */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_BACK_SECONDARY"] = 4] = "SLOT_BACK_SECONDARY";
    /**
     * A slot in a playback control UI for secondary forward-directed playback actions, most commonly
     * used for next or fast-forward actions.
     */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_FORWARD_SECONDARY"] = 5] = "SLOT_FORWARD_SECONDARY";
    /** A slot in a playback control UI for additional actions that don't fit into other slots. */
    NowPlayingCommandSlot[NowPlayingCommandSlot["SLOT_OVERFLOW"] = 6] = "SLOT_OVERFLOW";
})(NowPlayingCommandSlot || (NowPlayingCommandSlot = {}));
//# sourceMappingURL=NowPlayingCommandSlot.js.map