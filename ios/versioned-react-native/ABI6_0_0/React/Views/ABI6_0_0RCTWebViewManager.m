/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTWebViewManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTUIManager.h"
#import "ABI6_0_0RCTWebView.h"
#import "UIView+ReactABI6_0_0.h"

@interface ABI6_0_0RCTWebViewManager () <ABI6_0_0RCTWebViewDelegate>

@end

@implementation ABI6_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI6_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI6_0_0RCTWebView *webView = [ABI6_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)


ABI6_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI6_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI6_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI6_0_0RCTWebView *> *viewRegistry) {
    ABI6_0_0RCTWebView *view = viewRegistry[ReactABI6_0_0Tag];
    if (![view isKindOfClass:[ABI6_0_0RCTWebView class]]) {
      ABI6_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI6_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI6_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI6_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI6_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI6_0_0Tag];
    if (![view isKindOfClass:[ABI6_0_0RCTWebView class]]) {
      ABI6_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI6_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI6_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI6_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI6_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI6_0_0RCTWebView *> *viewRegistry) {
    ABI6_0_0RCTWebView *view = viewRegistry[ReactABI6_0_0Tag];
    if (![view isKindOfClass:[ABI6_0_0RCTWebView class]]) {
      ABI6_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI6_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI6_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI6_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI6_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI6_0_0RCTWebView *> *viewRegistry) {
    ABI6_0_0RCTWebView *view = viewRegistry[ReactABI6_0_0Tag];
    if (![view isKindOfClass:[ABI6_0_0RCTWebView class]]) {
      ABI6_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI6_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI6_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI6_0_0RCTDirectEventBlock)callback
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
    ABI6_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI6_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI6_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
