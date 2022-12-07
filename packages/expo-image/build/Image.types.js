/**
 * Determines how the image should be resized to fit its container.
 */
export var ImageContentFit;
(function (ImageContentFit) {
    /**
     * The image is sized to maintain its aspect ratio while filling the element's entire content box.
     * If the image's aspect ratio does not match the aspect ratio of its box, then the object will be clipped to fit.
     */
    ImageContentFit["COVER"] = "cover";
    /**
     * The image is scaled to maintain its aspect ratio while fitting within the element's content box.
     * The entire image is made to fill the box, while preserving its aspect ratio,
     * so the image will be "letterboxed" if its aspect ratio does not match the aspect ratio of the box.
     */
    ImageContentFit["CONTAIN"] = "contain";
    /**
     * The image is sized to fill the element's content box. The entire object will completely fill the box.
     * If the image's aspect ratio does not match the aspect ratio of its box, then the image will be stretched to fit.
     */
    ImageContentFit["FILL"] = "fill";
    /**
     * The image is not resized and is centered by default.
     * When specified, the exact position can be controlled with `objectPosition` option.
     */
    ImageContentFit["NONE"] = "none";
    /**
     * The image is sized as if `none` or `contain` were specified,
     * whichever would result in a smaller concrete object size.
     */
    ImageContentFit["SCALE_DOWN"] = "scale-down";
})(ImageContentFit || (ImageContentFit = {}));
/**
 * @deprecated The resize mode is deprecated in favor of `ImageContentFit` and `contentFit` prop.
 */
export var ImageResizeMode;
(function (ImageResizeMode) {
    /**
     * The image will be resized such that the entire area of the view
     * is covered by the image, potentially clipping parts of the image.
     */
    ImageResizeMode["COVER"] = "cover";
    /**
     * The image will be resized such that it will be completely
     * visible, contained within the frame of the view.
     */
    ImageResizeMode["CONTAIN"] = "contain";
    /**
     * The image will be stretched to fill the entire frame of the view without clipping.
     * This may change the aspect ratio of the image, distorting it.
     *
     * @platform ios
     */
    ImageResizeMode["STRETCH"] = "stretch";
    /**
     * The image will be repeated to cover the frame of the view.
     * The image will keep its size and aspect ratio.
     */
    ImageResizeMode["REPEAT"] = "repeat";
    /**
     * The image will be scaled down such that it is completely visible,
     * if bigger than the area of the view. The image will not be scaled up.
     */
    ImageResizeMode["CENTER"] = "center";
})(ImageResizeMode || (ImageResizeMode = {}));
export var ImageTransitionTiming;
(function (ImageTransitionTiming) {
    ImageTransitionTiming[ImageTransitionTiming["EASE_IN_OUT"] = 1] = "EASE_IN_OUT";
    ImageTransitionTiming[ImageTransitionTiming["EASE_IN"] = 2] = "EASE_IN";
    ImageTransitionTiming[ImageTransitionTiming["EASE_OUT"] = 3] = "EASE_OUT";
    ImageTransitionTiming[ImageTransitionTiming["LINEAR"] = 4] = "LINEAR";
})(ImageTransitionTiming || (ImageTransitionTiming = {}));
export var ImageTransitionEffect;
(function (ImageTransitionEffect) {
    ImageTransitionEffect[ImageTransitionEffect["NONE"] = 0] = "NONE";
    ImageTransitionEffect[ImageTransitionEffect["CROSS_DISOLVE"] = 1] = "CROSS_DISOLVE";
    ImageTransitionEffect[ImageTransitionEffect["FLIP_FROM_LEFT"] = 2] = "FLIP_FROM_LEFT";
    ImageTransitionEffect[ImageTransitionEffect["FLIP_FROM_RIGHT"] = 3] = "FLIP_FROM_RIGHT";
    ImageTransitionEffect[ImageTransitionEffect["FLIP_FROM_TOP"] = 4] = "FLIP_FROM_TOP";
    ImageTransitionEffect[ImageTransitionEffect["FLIP_FROM_BOTTOM"] = 5] = "FLIP_FROM_BOTTOM";
    ImageTransitionEffect[ImageTransitionEffect["CURL_UP"] = 6] = "CURL_UP";
    ImageTransitionEffect[ImageTransitionEffect["CURL_DOWN"] = 7] = "CURL_DOWN";
})(ImageTransitionEffect || (ImageTransitionEffect = {}));
export var ImageCacheType;
(function (ImageCacheType) {
    ImageCacheType["NONE"] = "none";
    ImageCacheType["DISK"] = "disk";
    ImageCacheType["MEMORY"] = "memory";
})(ImageCacheType || (ImageCacheType = {}));
export var ImagePriority;
(function (ImagePriority) {
    ImagePriority["LOW"] = "low";
    ImagePriority["NORMAL"] = "normal";
    ImagePriority["HIGH"] = "high";
})(ImagePriority || (ImagePriority = {}));
//# sourceMappingURL=Image.types.js.map