/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RNCWebViewManager.h"

#import <ReactABI35_0_0/ABI35_0_0RCTUIManager.h>
#import <ReactABI35_0_0/ABI35_0_0RCTDefines.h>
#import "ABI35_0_0RNCWebView.h"

#import "ABI35_0_0EXScopedModuleRegistry.h"

@interface ABI35_0_0RNCWebViewManager () <ABI35_0_0RNCWebViewDelegate>
@end

@implementation ABI35_0_0RCTConvert (UIScrollView)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI35_0_0RCT_ENUM_CONVERTER(UIScrollViewContentInsetAdjustmentBehavior, (@{
                                                                  @"automatic": @(UIScrollViewContentInsetAdjustmentAutomatic),
                                                                  @"scrollableAxes": @(UIScrollViewContentInsetAdjustmentScrollableAxes),
                                                                  @"never": @(UIScrollViewContentInsetAdjustmentNever),
                                                                  @"always": @(UIScrollViewContentInsetAdjustmentAlways),
                                                                  }), UIScrollViewContentInsetAdjustmentNever, integerValue)
#endif

@end

@implementation ABI35_0_0RNCWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
  NSString *_experienceId;
}

ABI35_0_0EX_EXPORT_SCOPED_MODULE(ABI35_0_0RNCWebViewManager, ABI35_0_0EXKernelServiceNone)

- (instancetype)initWithExperienceId:(NSString *)experienceId
                kernelServiceDelegate:(id)kernelServiceInstance
                               params:(NSDictionary *)params
 {
   if (self = [super init]) {
     _experienceId = experienceId;
   }
   return self;
 }

- (UIView *)view
{
  ABI35_0_0RNCWebView *webView = [ABI35_0_0RNCWebView new];
  webView.experienceId = _experienceId;
  webView.delegate = self;
  return webView;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(javaScriptEnabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(hideKeyboardAccessoryView, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(allowsBackForwardNavigationGestures, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(incognito, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(userAgent, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(applicationNameForUserAgent, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(cacheEnabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(allowsLinkPreview, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(allowingReadAccessToURL, NSString)

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000 /* __IPHONE_11_0 */
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)
#endif

/**
 * Expose methods to enable messaging the webview.
 */
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onScroll, ABI35_0_0RCTDirectEventBlock)

ABI35_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI35_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI35_0_0RNCWebView) {
  view.bounces = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(useSharedProcessPool, BOOL, ABI35_0_0RNCWebView) {
  view.useSharedProcessPool = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI35_0_0RNCWebView) {
  view.scrollEnabled = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(sharedCookiesEnabled, BOOL, ABI35_0_0RNCWebView) {
    view.sharedCookiesEnabled = json == nil ? false : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI35_0_0RNCWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI35_0_0RCTConvert CGFloat: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(directionalLockEnabled, BOOL, ABI35_0_0RNCWebView) {
    view.directionalLockEnabled = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL, ABI35_0_0RNCWebView) {
  view.showsHorizontalScrollIndicator = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL, ABI35_0_0RNCWebView) {
  view.showsVerticalScrollIndicator = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(keyboardDisplayRequiresUserAction, BOOL, ABI35_0_0RNCWebView) {
  view.keyboardDisplayRequiresUserAction = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI35_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RNCWebView *> *viewRegistry) {
    ABI35_0_0RNCWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RNCWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RNCWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI35_0_0RNCWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI35_0_0RCTDirectEventBlock)callback
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
    ABI35_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI35_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI35_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
