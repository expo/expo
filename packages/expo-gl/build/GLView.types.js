// @needsAudit
export var GLLoggingOption;
(function (GLLoggingOption) {
    /**
     * Disables logging entirely.
     */
    GLLoggingOption[GLLoggingOption["DISABLED"] = 0] = "DISABLED";
    /**
     * Logs method calls, their parameters and results.
     */
    GLLoggingOption[GLLoggingOption["METHOD_CALLS"] = 1] = "METHOD_CALLS";
    /**
     * Calls `gl.getError()` after each other method call and prints an error if any is returned.
     * This option has a significant impact on the performance as this method is blocking.
     */
    GLLoggingOption[GLLoggingOption["GET_ERRORS"] = 2] = "GET_ERRORS";
    /**
     * Resolves parameters of type `number` to their constant names.
     */
    GLLoggingOption[GLLoggingOption["RESOLVE_CONSTANTS"] = 4] = "RESOLVE_CONSTANTS";
    /**
     * When this option is enabled, long strings will be truncated.
     * It's useful if your shaders are really big and logging them significantly reduces performance.
     */
    GLLoggingOption[GLLoggingOption["TRUNCATE_STRINGS"] = 8] = "TRUNCATE_STRINGS";
    /**
     * Enables all other options. It implies `GET_ERRORS` so be aware of the slowdown.
     */
    GLLoggingOption[GLLoggingOption["ALL"] = 15] = "ALL";
})(GLLoggingOption || (GLLoggingOption = {}));
//# sourceMappingURL=GLView.types.js.map