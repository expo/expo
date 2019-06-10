/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTWKWebViewManager.h"

#import "ABI33_0_0RCTUIManager.h"
#import "ABI33_0_0RCTWKWebView.h"
#import <ReactABI33_0_0/ABI33_0_0RCTDefines.h>

@interface ABI33_0_0RCTWKWebViewManager () <ABI33_0_0RCTWKWebViewDelegate>
@end

@implementation ABI33_0_0RCTWKWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0RCTWKWebView *webView = [ABI33_0_0RCTWKWebView new];
  webView.delegate = self;
  return webView;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)

/**
 * Expose methods to enable messaging the webview.
 */
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI33_0_0RCTDirectEventBlock)

ABI33_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI33_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI33_0_0RCTWKWebView) {
  view.bounces = json == nil ? true : [ABI33_0_0RCTConvert BOOL: json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI33_0_0RCTWKWebView) {
  view.scrollEnabled = json == nil ? true : [ABI33_0_0RCTConvert BOOL: json];
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI33_0_0RCTWKWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI33_0_0RCTConvert CGFloat: json];
}

ABI33_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI33_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RCTWKWebView *> *viewRegistry) {
    ABI33_0_0RCTWKWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RCTWKWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI33_0_0RCTWKWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI33_0_0RCTDirectEventBlock)callback
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
    ABI33_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI33_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI33_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
