/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTWebViewManager.h"

#import "ABI22_0_0RCTBridge.h"
#import "ABI22_0_0RCTUIManager.h"
#import "ABI22_0_0RCTWebView.h"
#import "UIView+ReactABI22_0_0.h"

@interface ABI22_0_0RCTWebViewManager () <ABI22_0_0RCTWebViewDelegate>

@end

@implementation ABI22_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0RCTWebView *webView = [ABI22_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI22_0_0RCTDirectEventBlock)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI22_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI22_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTWebView *> *viewRegistry) {
    ABI22_0_0RCTWebView *view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTWebView *> *viewRegistry) {
    ABI22_0_0RCTWebView *view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTWebView *> *viewRegistry) {
    ABI22_0_0RCTWebView *view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI22_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTWebView *> *viewRegistry) {
    ABI22_0_0RCTWebView *view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI22_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI22_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI22_0_0RCTWebView *> *viewRegistry) {
    ABI22_0_0RCTWebView *view = viewRegistry[ReactABI22_0_0Tag];
    if (![view isKindOfClass:[ABI22_0_0RCTWebView class]]) {
      ABI22_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI22_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI22_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI22_0_0RCTDirectEventBlock)callback
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
    ABI22_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI22_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI22_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
