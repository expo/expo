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
//# sourceMappingURL=Image.types.js.map