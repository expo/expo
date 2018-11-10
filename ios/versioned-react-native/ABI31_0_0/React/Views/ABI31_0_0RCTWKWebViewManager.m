/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI31_0_0RCTWKWebViewManager.h"

#import "ABI31_0_0RCTUIManager.h"
#import "ABI31_0_0RCTWKWebView.h"
#import <ReactABI31_0_0/ABI31_0_0RCTDefines.h>

@interface ABI31_0_0RCTWKWebViewManager () <ABI31_0_0RCTWKWebViewDelegate>
@end

@implementation ABI31_0_0RCTWKWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0RCTWKWebView *webView = [ABI31_0_0RCTWKWebView new];
  webView.delegate = self;
  return webView;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI31_0_0RCTDirectEventBlock)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)

/**
 * Expose methods to enable messaging the webview.
 */
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI31_0_0RCTDirectEventBlock)

ABI31_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI31_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI31_0_0RCTWKWebView) {
  view.bounces = json == nil ? true : [ABI31_0_0RCTConvert BOOL: json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI31_0_0RCTWKWebView) {
  view.scrollEnabled = json == nil ? true : [ABI31_0_0RCTConvert BOOL: json];
}

ABI31_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI31_0_0RCTWKWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI31_0_0RCTConvert CGFloat: json];
}

ABI31_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI31_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI31_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI31_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI31_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI31_0_0RCTWKWebView *> *viewRegistry) {
    ABI31_0_0RCTWKWebView *view = viewRegistry[ReactABI31_0_0Tag];
    if (![view isKindOfClass:[ABI31_0_0RCTWKWebView class]]) {
      ABI31_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI31_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI31_0_0RCTWKWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI31_0_0RCTDirectEventBlock)callback
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
    ABI31_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI31_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI31_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
