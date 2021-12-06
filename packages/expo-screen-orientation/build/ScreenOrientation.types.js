// @needsAudit
export var Orientation;
(function (Orientation) {
    /**
     * An unknown screen orientation. For example, the device is flat, perhaps on a table.
     */
    Orientation[Orientation["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * Right-side up portrait interface orientation.
     */
    Orientation[Orientation["PORTRAIT_UP"] = 1] = "PORTRAIT_UP";
    /**
     * Upside down portrait interface orientation.
     */
    Orientation[Orientation["PORTRAIT_DOWN"] = 2] = "PORTRAIT_DOWN";
    /**
     * Left landscape interface orientation.
     */
    Orientation[Orientation["LANDSCAPE_LEFT"] = 3] = "LANDSCAPE_LEFT";
    /**
     * Right landscape interface orientation.
     */
    Orientation[Orientation["LANDSCAPE_RIGHT"] = 4] = "LANDSCAPE_RIGHT";
})(Orientation || (Orientation = {}));
// @needsAudit
/**
 * An enum whose values can be passed to the [`lockAsync`](#screenorientationlockasyncorientationlock)
 * method.
 * > __Note:__ `OrientationLock.ALL` and `OrientationLock.PORTRAIT` are invalid on devices which
 * > don't support `OrientationLock.PORTRAIT_DOWN`.
 */
export var OrientationLock;
(function (OrientationLock) {
    /**
     * The default orientation. On iOS, this will allow all orientations except `Orientation.PORTRAIT_DOWN`.
     * On Android, this lets the system decide the best orientation.
     */
    OrientationLock[OrientationLock["DEFAULT"] = 0] = "DEFAULT";
    /**
     * All four possible orientations
     */
    OrientationLock[OrientationLock["ALL"] = 1] = "ALL";
    /**
     * Any portrait orientation.
     */
    OrientationLock[OrientationLock["PORTRAIT"] = 2] = "PORTRAIT";
    /**
     * Right-side up portrait only.
     */
    OrientationLock[OrientationLock["PORTRAIT_UP"] = 3] = "PORTRAIT_UP";
    /**
     * Upside down portrait only.
     */
    OrientationLock[OrientationLock["PORTRAIT_DOWN"] = 4] = "PORTRAIT_DOWN";
    /**
     * Any landscape orientation.
     */
    OrientationLock[OrientationLock["LANDSCAPE"] = 5] = "LANDSCAPE";
    /**
     * Left landscape only.
     */
    OrientationLock[OrientationLock["LANDSCAPE_LEFT"] = 6] = "LANDSCAPE_LEFT";
    /**
     * Right landscape only.
     */
    OrientationLock[OrientationLock["LANDSCAPE_RIGHT"] = 7] = "LANDSCAPE_RIGHT";
    /**
     * A platform specific orientation. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).
     */
    OrientationLock[OrientationLock["OTHER"] = 8] = "OTHER";
    /**
     * An unknown screen orientation lock. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).
     */
    OrientationLock[OrientationLock["UNKNOWN"] = 9] = "UNKNOWN";
})(OrientationLock || (OrientationLock = {}));
// @needsAudit
/**
 * Each iOS device has a default set of [size classes](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html)
 * that you can use as a guide when designing your interface.
 */
export var SizeClassIOS;
(function (SizeClassIOS) {
    SizeClassIOS[SizeClassIOS["REGULAR"] = 0] = "REGULAR";
    SizeClassIOS[SizeClassIOS["COMPACT"] = 1] = "COMPACT";
    SizeClassIOS[SizeClassIOS["UNKNOWN"] = 2] = "UNKNOWN";
})(SizeClassIOS || (SizeClassIOS = {}));
// @needsAudit
/**
 * An enum representing the lock policies that can be applied on the web platform, modelled after
 * the [W3C specification](https://w3c.github.io/screen-orientation/#dom-orientationlocktype).
 * These values can be applied through the [`lockPlatformAsync`](#screenorientationlockplatformasyncoptions)
 * method.
 */
export var WebOrientationLock;
(function (WebOrientationLock) {
    WebOrientationLock["PORTRAIT_PRIMARY"] = "portrait-primary";
    WebOrientationLock["PORTRAIT_SECONDARY"] = "portrait-secondary";
    WebOrientationLock["PORTRAIT"] = "portrait";
    WebOrientationLock["LANDSCAPE_PRIMARY"] = "landscape-primary";
    WebOrientationLock["LANDSCAPE_SECONDARY"] = "landscape-secondary";
    WebOrientationLock["LANDSCAPE"] = "landscape";
    WebOrientationLock["ANY"] = "any";
    WebOrientationLock["NATURAL"] = "natural";
    WebOrientationLock["UNKNOWN"] = "unknown";
})(WebOrientationLock || (WebOrientationLock = {}));
// @docsMissing
export var WebOrientation;
(function (WebOrientation) {
    WebOrientation["PORTRAIT_PRIMARY"] = "portrait-primary";
    WebOrientation["PORTRAIT_SECONDARY"] = "portrait-secondary";
    WebOrientation["LANDSCAPE_PRIMARY"] = "landscape-primary";
    WebOrientation["LANDSCAPE_SECONDARY"] = "landscape-secondary";
})(WebOrientation || (WebOrientation = {}));
//# sourceMappingURL=ScreenOrientation.types.js.map