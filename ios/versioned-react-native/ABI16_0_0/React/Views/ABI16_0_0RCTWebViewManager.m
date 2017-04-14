/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTWebViewManager.h"

#import "ABI16_0_0RCTBridge.h"
#import "ABI16_0_0RCTUIManager.h"
#import "ABI16_0_0RCTWebView.h"
#import "UIView+ReactABI16_0_0.h"

@interface ABI16_0_0RCTWebViewManager () <ABI16_0_0RCTWebViewDelegate>

@end

@implementation ABI16_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI16_0_0RCTWebView *webView = [ABI16_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI16_0_0RCTDirectEventBlock)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI16_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI16_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTWebView *> *viewRegistry) {
    ABI16_0_0RCTWebView *view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTWebView *> *viewRegistry) {
    ABI16_0_0RCTWebView *view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTWebView *> *viewRegistry) {
    ABI16_0_0RCTWebView *view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI16_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTWebView *> *viewRegistry) {
    ABI16_0_0RCTWebView *view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI16_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI16_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI16_0_0RCTWebView *> *viewRegistry) {
    ABI16_0_0RCTWebView *view = viewRegistry[ReactABI16_0_0Tag];
    if (![view isKindOfClass:[ABI16_0_0RCTWebView class]]) {
      ABI16_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI16_0_0RCTWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI16_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI16_0_0RCTDirectEventBlock)callback
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
    ABI16_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI16_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI16_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
