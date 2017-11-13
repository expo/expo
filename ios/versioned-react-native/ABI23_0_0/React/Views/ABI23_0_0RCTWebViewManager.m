/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI23_0_0RCTWebViewManager.h"

#import "ABI23_0_0RCTBridge.h"
#import "ABI23_0_0RCTUIManager.h"
#import "ABI23_0_0RCTWebView.h"
#import "UIView+ReactABI23_0_0.h"

@interface ABI23_0_0RCTWebViewManager () <ABI23_0_0RCTWebViewDelegate>

@end

@implementation ABI23_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0RCTWebView *webView = [ABI23_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI23_0_0RCTDirectEventBlock)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI23_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI23_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTWebView *> *viewRegistry) {
    ABI23_0_0RCTWebView *view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTWebView *> *viewRegistry) {
    ABI23_0_0RCTWebView *view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTWebView *> *viewRegistry) {
    ABI23_0_0RCTWebView *view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI23_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTWebView *> *viewRegistry) {
    ABI23_0_0RCTWebView *view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI23_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI23_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI23_0_0RCTWebView *> *viewRegistry) {
    ABI23_0_0RCTWebView *view = viewRegistry[ReactABI23_0_0Tag];
    if (![view isKindOfClass:[ABI23_0_0RCTWebView class]]) {
      ABI23_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI23_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI23_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI23_0_0RCTDirectEventBlock)callback
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
    ABI23_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI23_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI23_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
