/**
 * Defines the slots in which custom media session buttons can be displayed in the now playing notification and lock screen controls.
 * @platform android
 */
export declare enum MediaSessionButtonSlot {
    /** A central slot in a playback control UI, most commonly used for play or pause actions. */
    SLOT_CENTRAL = 1,
    /**
     * A slot in a playback control UI for backward-directed playback actions, most commonly used for
     * previous or rewind actions.
     */
    SLOT_BACK = 2,
    /**
     * A slot in a playback control UI for forward-directed playback actions, most commonly used for
     * next or fast-forward actions.
     */
    SLOT_FORWARD = 3,
    /**
     * A slot in a playback control UI for secondary backward-directed playback actions, most commonly
     * used for previous or rewind actions.
     */
    SLOT_BACK_SECONDARY = 4,
    /**
     * A slot in a playback control UI for secondary forward-directed playback actions, most commonly
     * used for next or fast-forward actions.
     */
    SLOT_FORWARD_SECONDARY = 5,
    /** A slot in a playback control UI for additional actions that don't fit into other slots. */
    SLOT_OVERFLOW = 6
}
//# sourceMappingURL=MediaSessionButtonSlot.d.ts.map