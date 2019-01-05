/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTWKWebViewManager.h"

#import "ABI32_0_0RCTUIManager.h"
#import "ABI32_0_0RCTWKWebView.h"
#import <ReactABI32_0_0/ABI32_0_0RCTDefines.h>

@interface ABI32_0_0RCTWKWebViewManager () <ABI32_0_0RCTWKWebViewDelegate>
@end

@implementation ABI32_0_0RCTWKWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0RCTWKWebView *webView = [ABI32_0_0RCTWKWebView new];
  webView.delegate = self;
  return webView;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)

/**
 * Expose methods to enable messaging the webview.
 */
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI32_0_0RCTDirectEventBlock)

ABI32_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI32_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI32_0_0RCTWKWebView) {
  view.bounces = json == nil ? true : [ABI32_0_0RCTConvert BOOL: json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI32_0_0RCTWKWebView) {
  view.scrollEnabled = json == nil ? true : [ABI32_0_0RCTConvert BOOL: json];
}

ABI32_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI32_0_0RCTWKWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI32_0_0RCTConvert CGFloat: json];
}

ABI32_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI32_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWKWebView *> *viewRegistry) {
    ABI32_0_0RCTWKWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWKWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI32_0_0RCTWKWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
             withCallback:(ABI32_0_0RCTDirectEventBlock)callback
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
    ABI32_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI32_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI32_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
