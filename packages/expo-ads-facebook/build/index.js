export { default as withNativeAd } from './withNativeAd';
export { default as AdMediaView } from './AdMediaView';
export { default as AdIconView } from './AdIconView';
export { default as AdTriggerView } from './AdTriggerView';
export { default as AdSettings } from './AdSettings';
export { default as NativeAdsManager } from './NativeAdsManager';
export { default as InterstitialAdManager } from './InterstitialAdManager';
export { default as BannerAd } from './BannerAd';
// @ts-ignore
Object.defineProperties(exports, {
    // DEPRECATED since SDK 31
    MediaView: {
        get() {
            console.warn(`MediaView has been renamed to AdMediaView and will be removed in SDK 33; update the import in your code`);
            return require('./AdMediaView').default;
        },
    },
    TriggerableView: {
        get() {
            console.warn(`TriggerableView has been renamed to AdTriggerView and will be removed in SDK 33; update the import in your code`);
            return require('./AdTriggerView').default;
        },
    },
});
//# sourceMappingURL=index.js.map