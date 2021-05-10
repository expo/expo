/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI40_0_0RNCWebViewManager.h"

#import <ABI40_0_0React/ABI40_0_0RCTUIManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTDefines.h>
#import "ABI40_0_0RNCWebView.h"

#import "ABI40_0_0EXScopedModuleRegistry.h"

@interface ABI40_0_0RNCWebViewManager () <ABI40_0_0RNCWebViewDelegate>
@end

@implementation ABI40_0_0RCTConvert (WKWebView)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI40_0_0RCT_ENUM_CONVERTER(WKContentMode, (@{
    @"recommended": @(WKContentModeRecommended),
    @"mobile": @(WKContentModeMobile),
    @"desktop": @(WKContentModeDesktop),
}), WKContentModeRecommended, integerValue)
#endif
@end

@implementation ABI40_0_0RNCWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
  NSString *_experienceId;
}

ABI40_0_0EX_EXPORT_SCOPED_MODULE(ABI40_0_0RNCWebViewManager, ABI40_0_0EXKernelServiceNone)

- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

#if !TARGET_OS_OSX
- (UIView *)view
#else
- (ABI40_0_0RCTUIView *)view
#endif // !TARGET_OS_OSX
{
  ABI40_0_0RNCWebView *webView = [ABI40_0_0RNCWebView new];
  webView.experienceId = _experienceId;
  webView.delegate = self;
  return webView;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onFileDownload, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onHttpError, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onContentProcessDidTerminate, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoaded, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptForMainFrameOnly, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoadedForMainFrameOnly, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptCanOpenWindowsAutomatically, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(allowFileAccessFromFileURLs, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(autoManageStatusBarEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardAccessoryView, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(allowsBackForwardNavigationGestures, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(incognito, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(userAgent, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(applicationNameForUserAgent, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(allowsLinkPreview, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(allowingReadAccessToURL, NSString)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(contentMode, WKContentMode)
#endif

/**
 * Expose methods to enable messaging the webview.
 */
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI40_0_0RCTDirectEventBlock)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI40_0_0RCTDirectEventBlock)

ABI40_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ABI40_0_0ReactTag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(pullToRefreshEnabled, BOOL, ABI40_0_0RNCWebView) {
    view.pullToRefreshEnabled = json == nil ? false : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI40_0_0RNCWebView) {
  view.bounces = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(useSharedProcessPool, BOOL, ABI40_0_0RNCWebView) {
  view.useSharedProcessPool = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI40_0_0RNCWebView) {
  view.scrollEnabled = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(sharedCookiesEnabled, BOOL, ABI40_0_0RNCWebView) {
    view.sharedCookiesEnabled = json == nil ? false : [ABI40_0_0RCTConvert BOOL: json];
}

#if !TARGET_OS_OSX
ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI40_0_0RNCWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI40_0_0RCTConvert CGFloat: json];
}
#endif // !TARGET_OS_OSX

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(directionalLockEnabled, BOOL, ABI40_0_0RNCWebView) {
    view.directionalLockEnabled = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL, ABI40_0_0RNCWebView) {
  view.showsHorizontalScrollIndicator = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL, ABI40_0_0RNCWebView) {
  view.showsVerticalScrollIndicator = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDisplayRequiresUserAction, BOOL, ABI40_0_0RNCWebView) {
  view.keyboardDisplayRequiresUserAction = json == nil ? true : [ABI40_0_0RCTConvert BOOL: json];
}

ABI40_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ABI40_0_0ReactTag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI40_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ABI40_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI40_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI40_0_0RNCWebView *> *viewRegistry) {
    ABI40_0_0RNCWebView *view = viewRegistry[ABI40_0_0ReactTag];
    if (![view isKindOfClass:[ABI40_0_0RNCWebView class]]) {
      ABI40_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI40_0_0RNCWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI40_0_0RNCWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI40_0_0RCTDirectEventBlock)callback
{
  _shouldStartLoadLock = [[NSConditionLock alloc] initWithCondition:arc4random()];
  _shouldStartLoad = YES;
  request[@"lockIdentifier"] = @(_shouldStartLoadLock.condition);
  callback(request);

  // Block the main thread for a maximum of 250ms until the JS thread returns
  if ([_shouldStartLoadLock lockWhenCondition:0 beforeDate:[NSDate dateWithTimeIntervalSinceNow:.25]]) {
    BOOL returnValue = _shouldStartLoad;
    [_shouldStartLoadLock unlock];
    _shouldStartLoadLock = nil;
    return returnValue;
  } else {
    ABI40_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI40_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI40_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
