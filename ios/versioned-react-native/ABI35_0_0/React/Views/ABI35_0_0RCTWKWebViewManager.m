/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTWKWebViewManager.h"

#import "ABI35_0_0RCTUIManager.h"
#import "ABI35_0_0RCTWKWebView.h"
#import <ReactABI35_0_0/ABI35_0_0RCTDefines.h>

@interface ABI35_0_0RCTWKWebViewManager () <ABI35_0_0RCTWKWebViewDelegate>
@end

@implementation ABI35_0_0RCTWKWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0RCTWKWebView *webView = [ABI35_0_0RCTWKWebView new];
  webView.delegate = self;
  return webView;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(allowsInlineMediaPlayback, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, BOOL)
#if WEBKIT_IOS_10_APIS_AVAILABLE
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(dataDetectorTypes, WKDataDetectorTypes)
#endif
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)

/**
 * Expose methods to enable messaging the webview.
 */
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI35_0_0RCTDirectEventBlock)

ABI35_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI35_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(bounces, BOOL, ABI35_0_0RCTWKWebView) {
  view.bounces = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(scrollEnabled, BOOL, ABI35_0_0RCTWKWebView) {
  view.scrollEnabled = json == nil ? true : [ABI35_0_0RCTConvert BOOL: json];
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(decelerationRate, CGFloat, ABI35_0_0RCTWKWebView) {
  view.decelerationRate = json == nil ? UIScrollViewDecelerationRateNormal : [ABI35_0_0RCTConvert CGFloat: json];
}

ABI35_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI35_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI35_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI35_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI35_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI35_0_0RCTWKWebView *> *viewRegistry) {
    ABI35_0_0RCTWKWebView *view = viewRegistry[ReactABI35_0_0Tag];
    if (![view isKindOfClass:[ABI35_0_0RCTWKWebView class]]) {
      ABI35_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI35_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)          webView:(ABI35_0_0RCTWKWebView *)webView
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
