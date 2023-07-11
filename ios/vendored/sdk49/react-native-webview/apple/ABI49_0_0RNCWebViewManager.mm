#import <ABI49_0_0React/ABI49_0_0RCTUIManager.h>

#import "ABI49_0_0RNCWebViewManager.h"
#import "ABI49_0_0RNCWebViewImpl.h"
#import "ABI49_0_0RNCWebViewDecisionManager.h"
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import "ABI49_0_0RNCWebViewSpec/ABI49_0_0RNCWebViewSpec.h"
#endif

#if TARGET_OS_OSX
#define ABI49_0_0RNCView NSView
@class NSView;
#else
#define ABI49_0_0RNCView UIView
@class UIView;
#endif  // TARGET_OS_OSX

@implementation ABI49_0_0RCTConvert (WKWebView)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI49_0_0RCT_ENUM_CONVERTER(WKContentMode, (@{
  @"recommended": @(WKContentModeRecommended),
  @"mobile": @(WKContentModeMobile),
  @"desktop": @(WKContentModeDesktop),
}), WKContentModeRecommended, integerValue)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 150000 /* iOS 15 */
ABI49_0_0RCT_ENUM_CONVERTER(ABI49_0_0RNCWebViewPermissionGrantType, (@{
  @"grantIfSameHostElsePrompt": @(ABI49_0_0RNCWebViewPermissionGrantType_GrantIfSameHost_ElsePrompt),
  @"grantIfSameHostElseDeny": @(ABI49_0_0RNCWebViewPermissionGrantType_GrantIfSameHost_ElseDeny),
  @"deny": @(ABI49_0_0RNCWebViewPermissionGrantType_Deny),
  @"grant": @(ABI49_0_0RNCWebViewPermissionGrantType_Grant),
  @"prompt": @(ABI49_0_0RNCWebViewPermissionGrantType_Prompt),
}), ABI49_0_0RNCWebViewPermissionGrantType_Prompt, integerValue)
#endif
@end


@implementation ABI49_0_0RNCWebViewManager {
    NSString *_scopeKey;
    NSConditionLock *_shouldStartLoadLock;
    BOOL _shouldStartLoad;
}

ABI49_0_0RCT_EXPORT_MODULE(ABI49_0_0RNCWebView)

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                          scopeKey:(NSString *)scopeKey
                      easProjectId:(NSString *)easProjectId
              kernelServiceDelegate:(id)kernelServiceInstance
                            params:(NSDictionary *)params
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
  }
  return self;
}

- (ABI49_0_0RNCView *)view
{
  ABI49_0_0RNCWebViewImpl *webview = [[ABI49_0_0RNCWebViewImpl alloc] init];
  webview.scopeKey = _scopeKey;
  return webview;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
// New arch only
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(newSource, NSDictionary, ABI49_0_0RNCWebViewImpl) {}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onFileDownload, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onHttpError, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onContentProcessDidTerminate, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoaded, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptForMainFrameOnly, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoadedForMainFrameOnly, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptCanOpenWindowsAutomatically, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowFileAccessFromFileURLs, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowUniversalAccessFromFileURLs, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(webviewDebuggingEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowsAirPlayForMediaPlayback, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(autoManageStatusBarEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardAccessoryView, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowsBackForwardNavigationGestures, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(incognito, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(applicationNameForUserAgent, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowsLinkPreview, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(allowingReadAccessToURL, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(basicAuthCredential, NSDictionary)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustsScrollIndicatorInsets, BOOL)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(contentMode, WKContentMode)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 140000 /* iOS 14 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(limitsNavigationsToAppBoundDomains, BOOL)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 140500 /* iOS 14.5 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(textInteractionEnabled, BOOL)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 150000 /* iOS 15 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(mediaCapturePermissionGrantType, ABI49_0_0RNCWebViewPermissionGrantType)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(fraudulentWebsiteWarningEnabled, BOOL)
#endif

/**
 * Expose methods to enable messaging the webview.
 */
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(enableApplePay, BOOL)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(menuItems, NSArray);
// New arch only
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(hasOnFileDownload, BOOL, ABI49_0_0RNCWebViewImpl) {}
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(onCustomMenuSelection, ABI49_0_0RCTDirectEventBlock)
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(pullToRefreshEnabled, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.pullToRefreshEnabled = json == nil ? false : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.bounces = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(useSharedProcessPool, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.useSharedProcessPool = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(userAgent, NSString, ABI49_0_0RNCWebViewImpl) {
  view.userAgent = [ABI49_0_0RCTConvert NSString: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.scrollEnabled = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(sharedCookiesEnabled, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.sharedCookiesEnabled = json == nil ? false : [ABI49_0_0RCTConvert BOOL: json];
}

#if !TARGET_OS_OSX
ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI49_0_0RNCWebViewImpl) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI49_0_0RCTConvert CGFloat: json];
}
#endif // !TARGET_OS_OSX

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(directionalLockEnabled, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.directionalLockEnabled = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.showsHorizontalScrollIndicator = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.showsVerticalScrollIndicator = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

ABI49_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDisplayRequiresUserAction, BOOL, ABI49_0_0RNCWebViewImpl) {
  view.keyboardDisplayRequiresUserAction = json == nil ? true : [ABI49_0_0RCTConvert BOOL: json];
}

#if !TARGET_OS_OSX
    #define BASE_VIEW_PER_OS() UIView
#else
    #define BASE_VIEW_PER_OS() NSView
#endif

#define QUICK_RCT_EXPORT_COMMAND_METHOD(name)                                                                                           \
ABI49_0_0RCT_EXPORT_METHOD(name:(nonnull NSNumber *)ABI49_0_0ReactTag)                                                                                    \
{                                                                                                                                       \
[self.bridge.uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, BASE_VIEW_PER_OS() *> *viewRegistry) {   \
    ABI49_0_0RNCWebViewImpl *view = (ABI49_0_0RNCWebViewImpl *)viewRegistry[ABI49_0_0ReactTag];                                                                    \
    if (![view isKindOfClass:[ABI49_0_0RNCWebViewImpl class]]) {                                                                                 \
      ABI49_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI49_0_0RNCWebView, got: %@", view);                                         \
    } else {                                                                                                                            \
      [view name];                                                                                                                      \
    }                                                                                                                                   \
  }];                                                                                                                                   \
}
#define QUICK_RCT_EXPORT_COMMAND_METHOD_PARAMS(name, in_param, out_param)                                                               \
ABI49_0_0RCT_EXPORT_METHOD(name:(nonnull NSNumber *)ABI49_0_0ReactTag in_param)                                                                           \
{                                                                                                                                       \
[self.bridge.uiManager addUIBlock:^(__unused ABI49_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, BASE_VIEW_PER_OS() *> *viewRegistry) {   \
    ABI49_0_0RNCWebViewImpl *view = (ABI49_0_0RNCWebViewImpl *)viewRegistry[ABI49_0_0ReactTag];                                                                    \
    if (![view isKindOfClass:[ABI49_0_0RNCWebViewImpl class]]) {                                                                                 \
      ABI49_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI49_0_0RNCWebView, got: %@", view);                                         \
    } else {                                                                                                                            \
      [view name:out_param];                                                                                                            \
    }                                                                                                                                   \
  }];                                                                                                                                   \
}

QUICK_RCT_EXPORT_COMMAND_METHOD(reload)
QUICK_RCT_EXPORT_COMMAND_METHOD(goBack)
QUICK_RCT_EXPORT_COMMAND_METHOD(goForward)
QUICK_RCT_EXPORT_COMMAND_METHOD(stopLoading)
QUICK_RCT_EXPORT_COMMAND_METHOD(requestFocus)

QUICK_RCT_EXPORT_COMMAND_METHOD_PARAMS(postMessage, message:(NSString *)message, message)
QUICK_RCT_EXPORT_COMMAND_METHOD_PARAMS(injectJavaScript, script:(NSString *)script, script)

ABI49_0_0RCT_EXPORT_METHOD(shouldStartLoadWithLockIdentifier:(BOOL)shouldStart
                                        lockIdentifier:(double)lockIdentifier)
{
    [[ABI49_0_0RNCWebViewDecisionManager getInstance] setResult:shouldStart forLockIdentifier:(int)lockIdentifier];
}

// Thanks to this guard, we won't compile this code when we build for the old architecture.
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::TurboModule>)getTurboModule:
    (const ABI49_0_0facebook::ABI49_0_0React::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<ABI49_0_0facebook::ABI49_0_0React::NativeRNCWebViewSpecJSI>(params);
}
#endif

@end
