/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTWebViewManager.h"

#import "ABI12_0_0RCTBridge.h"
#import "ABI12_0_0RCTUIManager.h"
#import "ABI12_0_0RCTWebView.h"
#import "UIView+ReactABI12_0_0.h"

@interface ABI12_0_0RCTWebViewManager () <ABI12_0_0RCTWebViewDelegate>

@end

@implementation ABI12_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI12_0_0RCTWebView *webView = [ABI12_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI12_0_0RCTDirectEventBlock)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI12_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI12_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTWebView *> *viewRegistry) {
    ABI12_0_0RCTWebView *view = viewRegistry[ReactABI12_0_0Tag];
    if (![view isKindOfClass:[ABI12_0_0RCTWebView class]]) {
      ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI12_0_0Tag];
    if (![view isKindOfClass:[ABI12_0_0RCTWebView class]]) {
      ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTWebView *> *viewRegistry) {
    ABI12_0_0RCTWebView *view = viewRegistry[ReactABI12_0_0Tag];
    if (![view isKindOfClass:[ABI12_0_0RCTWebView class]]) {
      ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTWebView *> *viewRegistry) {
    ABI12_0_0RCTWebView *view = viewRegistry[ReactABI12_0_0Tag];
    if (![view isKindOfClass:[ABI12_0_0RCTWebView class]]) {
      ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI12_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI12_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI12_0_0RCTWebView *> *viewRegistry) {
    ABI12_0_0RCTWebView *view = viewRegistry[ReactABI12_0_0Tag];
    if (![view isKindOfClass:[ABI12_0_0RCTWebView class]]) {
      ABI12_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI12_0_0RCTWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI12_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI12_0_0RCTDirectEventBlock)callback
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
    ABI12_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI12_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI12_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
