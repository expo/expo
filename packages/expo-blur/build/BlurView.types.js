/**
 * Blur method to use on Android.
 */
export var ExperimentalBlurMethod;
(function (ExperimentalBlurMethod) {
    /**
     * Falls back to a semi-transparent view instead of rendering a blur effect.
     */
    ExperimentalBlurMethod["None"] = "NONE";
    /**
     * Uses a native blur view implementation based on [BlurView](https://github.com/Dimezis/BlurView) library.
     *
     * This method may lead to decreased performance and rendering issues during transitions made by `react-native-screens`.
     */
    ExperimentalBlurMethod["DimezisBlurView"] = "DIMEZIS_BLUR_VIEW";
})(ExperimentalBlurMethod || (ExperimentalBlurMethod = {}));
//# sourceMappingURL=BlurView.types.js.map