/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RNCWebViewManager.h"

#import <ABI41_0_0React/ABI41_0_0RCTUIManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTDefines.h>
#import "ABI41_0_0RNCWebView.h"

@interface ABI41_0_0RNCWebViewManager () <ABI41_0_0RNCWebViewDelegate>
@end

@implementation ABI41_0_0RCTConvert (WKWebView)
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI41_0_0RCT_ENUM_CONVERTER(WKContentMode, (@{
    @"recommended": @(WKContentModeRecommended),
    @"mobile": @(WKContentModeMobile),
    @"desktop": @(WKContentModeDesktop),
}), WKContentModeRecommended, integerValue)
#endif
@end

@implementation ABI41_0_0RNCWebViewManager
{
  NSString *_experienceId;
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

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
- (ABI41_0_0RCTUIView *)view
#endif // !TARGET_OS_OSX
{
  ABI41_0_0RNCWebView *webView = [ABI41_0_0RNCWebView new];
  webView.experienceId = _experienceId;
  webView.delegate = self;
  return webView;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onFileDownload, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onHttpError, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onContentProcessDidTerminate, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoaded, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptForMainFrameOnly, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoadedForMainFrameOnly, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptCanOpenWindowsAutomatically, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowFileAccessFromFileURLs, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowUniversalAccessFromFileURLs, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(autoManageStatusBarEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardAccessoryView, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowsBackForwardNavigationGestures, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(incognito, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(userAgent, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(applicationNameForUserAgent, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowsLinkPreview, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(allowingReadAccessToURL, NSString)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* __IPHONE_13_0 */
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustsScrollIndicatorInsets, BOOL)
#endif

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000 /* iOS 13 */
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(contentMode, WKContentMode)
#endif

/**
 * Expose methods to enable messaging the webview.
 */
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI41_0_0RCTDirectEventBlock)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI41_0_0RCTDirectEventBlock)

ABI41_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ABI41_0_0ReactTag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(pullToRefreshEnabled, BOOL, ABI41_0_0RNCWebView) {
    view.pullToRefreshEnabled = json == nil ? false : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI41_0_0RNCWebView) {
  view.bounces = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(useSharedProcessPool, BOOL, ABI41_0_0RNCWebView) {
  view.useSharedProcessPool = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI41_0_0RNCWebView) {
  view.scrollEnabled = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(sharedCookiesEnabled, BOOL, ABI41_0_0RNCWebView) {
    view.sharedCookiesEnabled = json == nil ? false : [ABI41_0_0RCTConvert BOOL: json];
}

#if !TARGET_OS_OSX
ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI41_0_0RNCWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI41_0_0RCTConvert CGFloat: json];
}
#endif // !TARGET_OS_OSX

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(directionalLockEnabled, BOOL, ABI41_0_0RNCWebView) {
    view.directionalLockEnabled = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL, ABI41_0_0RNCWebView) {
  view.showsHorizontalScrollIndicator = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL, ABI41_0_0RNCWebView) {
  view.showsVerticalScrollIndicator = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDisplayRequiresUserAction, BOOL, ABI41_0_0RNCWebView) {
  view.keyboardDisplayRequiresUserAction = json == nil ? true : [ABI41_0_0RCTConvert BOOL: json];
}

ABI41_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ABI41_0_0ReactTag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI41_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI41_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI41_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI41_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ABI41_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI41_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI41_0_0RNCWebView *> *viewRegistry) {
    ABI41_0_0RNCWebView *view = viewRegistry[ABI41_0_0ReactTag];
    if (![view isKindOfClass:[ABI41_0_0RNCWebView class]]) {
      ABI41_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI41_0_0RNCWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI41_0_0RNCWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI41_0_0RCTDirectEventBlock)callback
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
    ABI41_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI41_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI41_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
