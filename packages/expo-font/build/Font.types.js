// @needsAudit
/**
 * Sets the [font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
 * for a given typeface. The default font value on web is `FontDisplay.AUTO`.
 * Even though setting the `fontDisplay` does nothing on native platforms, the default behavior
 * emulates `FontDisplay.SWAP` on flagship devices like iOS, Samsung, Pixel, etc. Default
 * functionality varies on One Plus devices. In the browser this value is set in the generated
 * `@font-face` CSS block and not as a style property meaning you cannot dynamically change this
 * value based on the element it's used in.
 * @platform web
 */
export var FontDisplay;
(function (FontDisplay) {
    /**
     * __(Default)__ The font display strategy is defined by the user agent or platform.
     * This generally defaults to the text being invisible until the font is loaded.
     * Good for buttons or banners that require a specific treatment.
     */
    FontDisplay["AUTO"] = "auto";
    /**
     * Fallback text is rendered immediately with a default font while the desired font is loaded.
     * This is good for making the content appear to load instantly and is usually preferred.
     */
    FontDisplay["SWAP"] = "swap";
    /**
     * The text will be invisible until the font has loaded. If the font fails to load then nothing
     * will appear - it's best to turn this off when debugging missing text.
     */
    FontDisplay["BLOCK"] = "block";
    /**
     * Splits the behavior between `SWAP` and `BLOCK`.
     * There will be a [100ms timeout](https://developers.google.com/web/updates/2016/02/font-display?hl=en)
     * where the text with a custom font is invisible, after that the text will either swap to the
     * styled text or it'll show the unstyled text and continue to load the custom font. This is good
     * for buttons that need a custom font but should also be quickly available to screen-readers.
     */
    FontDisplay["FALLBACK"] = "fallback";
    /**
     * This works almost identically to `FALLBACK`, the only difference is that the browser will
     * decide to load the font based on slow connection speed or critical resource demand.
     */
    FontDisplay["OPTIONAL"] = "optional";
})(FontDisplay || (FontDisplay = {}));
//# sourceMappingURL=Font.types.js.map