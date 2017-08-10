/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI20_0_0RCTWebViewManager.h"

#import "ABI20_0_0RCTBridge.h"
#import "ABI20_0_0RCTUIManager.h"
#import "ABI20_0_0RCTWebView.h"
#import "UIView+ReactABI20_0_0.h"

@interface ABI20_0_0RCTWebViewManager () <ABI20_0_0RCTWebViewDelegate>

@end

@implementation ABI20_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0RCTWebView *webView = [ABI20_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI20_0_0RCTDirectEventBlock)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI20_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI20_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTWebView *> *viewRegistry) {
    ABI20_0_0RCTWebView *view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTWebView *> *viewRegistry) {
    ABI20_0_0RCTWebView *view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTWebView *> *viewRegistry) {
    ABI20_0_0RCTWebView *view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI20_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTWebView *> *viewRegistry) {
    ABI20_0_0RCTWebView *view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI20_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI20_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI20_0_0RCTWebView *> *viewRegistry) {
    ABI20_0_0RCTWebView *view = viewRegistry[ReactABI20_0_0Tag];
    if (![view isKindOfClass:[ABI20_0_0RCTWebView class]]) {
      ABI20_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI20_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI20_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI20_0_0RCTDirectEventBlock)callback
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
    ABI20_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI20_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI20_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
