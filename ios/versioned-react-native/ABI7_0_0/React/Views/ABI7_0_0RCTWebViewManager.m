/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTWebViewManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTUIManager.h"
#import "ABI7_0_0RCTWebView.h"
#import "UIView+ReactABI7_0_0.h"

@interface ABI7_0_0RCTWebViewManager () <ABI7_0_0RCTWebViewDelegate>

@end

@implementation ABI7_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI7_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI7_0_0RCTWebView *webView = [ABI7_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI7_0_0RCTDirectEventBlock)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI7_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)


ABI7_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI7_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTWebView *> *viewRegistry) {
    ABI7_0_0RCTWebView *view = viewRegistry[ReactABI7_0_0Tag];
    if (![view isKindOfClass:[ABI7_0_0RCTWebView class]]) {
      ABI7_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI7_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI7_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI7_0_0Tag];
    if (![view isKindOfClass:[ABI7_0_0RCTWebView class]]) {
      ABI7_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI7_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI7_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTWebView *> *viewRegistry) {
    ABI7_0_0RCTWebView *view = viewRegistry[ReactABI7_0_0Tag];
    if (![view isKindOfClass:[ABI7_0_0RCTWebView class]]) {
      ABI7_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI7_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI7_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI7_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI7_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI7_0_0RCTWebView *> *viewRegistry) {
    ABI7_0_0RCTWebView *view = viewRegistry[ReactABI7_0_0Tag];
    if (![view isKindOfClass:[ABI7_0_0RCTWebView class]]) {
      ABI7_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI7_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI7_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI7_0_0RCTDirectEventBlock)callback
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
    ABI7_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI7_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI7_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
