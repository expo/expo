/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTWebViewManager.h"

#import "ABI8_0_0RCTBridge.h"
#import "ABI8_0_0RCTUIManager.h"
#import "ABI8_0_0RCTWebView.h"
#import "UIView+ReactABI8_0_0.h"

@interface ABI8_0_0RCTWebViewManager () <ABI8_0_0RCTWebViewDelegate>

@end

@implementation ABI8_0_0RCTWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI8_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI8_0_0RCTWebView *webView = [ABI8_0_0RCTWebView new];
  webView.delegate = self;
  return webView;
}

ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI8_0_0RCTDirectEventBlock)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI8_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)

ABI8_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI8_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTWebView *> *viewRegistry) {
    ABI8_0_0RCTWebView *view = viewRegistry[ReactABI8_0_0Tag];
    if (![view isKindOfClass:[ABI8_0_0RCTWebView class]]) {
      ABI8_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI8_0_0RCTWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI8_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    id view = viewRegistry[ReactABI8_0_0Tag];
    if (![view isKindOfClass:[ABI8_0_0RCTWebView class]]) {
      ABI8_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI8_0_0RCTWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI8_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTWebView *> *viewRegistry) {
    ABI8_0_0RCTWebView *view = viewRegistry[ReactABI8_0_0Tag];
    if (![view isKindOfClass:[ABI8_0_0RCTWebView class]]) {
      ABI8_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI8_0_0RCTWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI8_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI8_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI8_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI8_0_0RCTWebView *> *viewRegistry) {
    ABI8_0_0RCTWebView *view = viewRegistry[ReactABI8_0_0Tag];
    if (![view isKindOfClass:[ABI8_0_0RCTWebView class]]) {
      ABI8_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI8_0_0RCTWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI8_0_0RCTWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI8_0_0RCTDirectEventBlock)callback
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
    ABI8_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI8_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI8_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %zd, expected %zd", lockIdentifier, _shouldStartLoadLock.condition);
  }
}

@end
