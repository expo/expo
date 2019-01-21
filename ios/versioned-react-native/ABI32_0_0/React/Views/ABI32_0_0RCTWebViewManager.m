/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTWebViewManager.h"

#import "ABI32_0_0RCTBridge.h"
#import "ABI32_0_0RCTUIManager.h"
#import "ABI32_0_0RCTWebView.h"
#import "UIView+ReactABI32_0_0.h"

@interface ABI32_0_0RCTWebViewManager () <ABI32_0_0RCTWebViewDelegate>

@end

@implementation ABI32_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0RCTWebView *webView = [ABI32_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI32_0_0RCTDirectEventBlock)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI32_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI32_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI32_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI32_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI32_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI32_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI32_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI32_0_0RCTWebView *> *viewRegistry) {
    ABI32_0_0RCTWebView *view = viewRegistry[ReactABI32_0_0Tag];
    if (![view isKindOfClass:[ABI32_0_0RCTWebView class]]) {
      ABI32_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI32_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI32_0_0RCTWebView *)webView
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
