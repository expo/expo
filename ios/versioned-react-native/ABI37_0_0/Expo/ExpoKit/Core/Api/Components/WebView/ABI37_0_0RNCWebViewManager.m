/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RNCWebViewManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTUIManager.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import "ABI37_0_0RNCWebView.h"

@interface ABI37_0_0RNCWebViewManager () <ABI37_0_0RNCWebViewDelegate>
@end

@implementation ABI37_0_0RNCWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI37_0_0RCT_EXPORT_MODULE()

#if !TARGET_OS_OSX
- (UIView *)view
#else
- (ABI37_0_0RCTUIView *)view
#endif // !TARGET_OS_OSX
{
  ABI37_0_0RNCWebView *webView = [ABI37_0_0RNCWebView new];
  webView.delegate = self;
  return webView;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onHttpError, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onContentProcessDidTerminate, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScriptBeforeContentLoaded, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptEnabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(allowFileAccessFromFileURLs, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardAccessoryView, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(allowsBackForwardNavigationGestures, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(incognito, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(userAgent, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(applicationNameForUserAgent, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(allowsLinkPreview, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(allowingReadAccessToURL, NSString)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

/**
 * Expose methods to enable messaging the webview.
 */
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI37_0_0RCTDirectEventBlock)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI37_0_0RCTDirectEventBlock)

ABI37_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ABI37_0_0ReactTag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI37_0_0RNCWebView) {
  view.bounces = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(useSharedProcessPool, BOOL, ABI37_0_0RNCWebView) {
  view.useSharedProcessPool = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI37_0_0RNCWebView) {
  view.scrollEnabled = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(sharedCookiesEnabled, BOOL, ABI37_0_0RNCWebView) {
    view.sharedCookiesEnabled = json == nil ? false : [ABI37_0_0RCTConvert BOOL: json];
}

#if !TARGET_OS_OSX
ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI37_0_0RNCWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI37_0_0RCTConvert CGFloat: json];
}
#endif // !TARGET_OS_OSX

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(directionalLockEnabled, BOOL, ABI37_0_0RNCWebView) {
    view.directionalLockEnabled = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL, ABI37_0_0RNCWebView) {
  view.showsHorizontalScrollIndicator = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL, ABI37_0_0RNCWebView) {
  view.showsVerticalScrollIndicator = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDisplayRequiresUserAction, BOOL, ABI37_0_0RNCWebView) {
  view.keyboardDisplayRequiresUserAction = json == nil ? true : [ABI37_0_0RCTConvert BOOL: json];
}

ABI37_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ABI37_0_0ReactTag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI37_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI37_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI37_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI37_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ABI37_0_0ReactTag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI37_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI37_0_0RNCWebView *> *viewRegistry) {
    ABI37_0_0RNCWebView *view = viewRegistry[ABI37_0_0ReactTag];
    if (![view isKindOfClass:[ABI37_0_0RNCWebView class]]) {
      ABI37_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI37_0_0RNCWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI37_0_0RNCWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI37_0_0RCTDirectEventBlock)callback
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
    ABI37_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI37_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI37_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
