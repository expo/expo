/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTWebViewManager.h"

#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTUIManager.h"
#import "ABI13_0_0RCTWebView.h"
#import "UIView+ReactABI13_0_0.h"

@interface ABI13_0_0RCTWebViewManager () <ABI13_0_0RCTWebViewDelegate>

@end

@implementation ABI13_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI13_0_0RCTWebView *webView = [ABI13_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI13_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTWebView *> *viewRegistry) {
    ABI13_0_0RCTWebView *view = viewRegistry[ReactABI13_0_0Tag];
    if (![view isKindOfClass:[ABI13_0_0RCTWebView class]]) {
      ABI13_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI13_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI13_0_0Tag];
    if (![view isKindOfClass:[ABI13_0_0RCTWebView class]]) {
      ABI13_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI13_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTWebView *> *viewRegistry) {
    ABI13_0_0RCTWebView *view = viewRegistry[ReactABI13_0_0Tag];
    if (![view isKindOfClass:[ABI13_0_0RCTWebView class]]) {
      ABI13_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI13_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTWebView *> *viewRegistry) {
    ABI13_0_0RCTWebView *view = viewRegistry[ReactABI13_0_0Tag];
    if (![view isKindOfClass:[ABI13_0_0RCTWebView class]]) {
      ABI13_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI13_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI13_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI13_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI13_0_0RCTWebView *> *viewRegistry) {
    ABI13_0_0RCTWebView *view = viewRegistry[ReactABI13_0_0Tag];
    if (![view isKindOfClass:[ABI13_0_0RCTWebView class]]) {
      ABI13_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI13_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI13_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI13_0_0RCTDirectEventBlock)callback
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
    ABI13_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI13_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI13_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
