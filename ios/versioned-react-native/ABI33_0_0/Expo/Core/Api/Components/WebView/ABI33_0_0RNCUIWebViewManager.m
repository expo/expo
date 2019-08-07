#import "ABI33_0_0RNCUIWebViewManager.h"

#import <ReactABI33_0_0/ABI33_0_0RCTBridge.h>
#import <ReactABI33_0_0/ABI33_0_0RCTUIManager.h>
#import <ReactABI33_0_0/UIView+ReactABI33_0_0.h>
#import "ABI33_0_0RNCUIWebView.h"

@interface ABI33_0_0RNCUIWebViewManager () <ABI33_0_0RNCUIWebViewDelegate>

@end

@implementation ABI33_0_0RNCUIWebViewManager
{
  NSConditionLock *_shouldStartLoadLock;
  BOOL _shouldStartLoad;
}

ABI33_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI33_0_0RNCUIWebView *webView = [ABI33_0_0RNCUIWebView new];
  webView.delegate = self;
  return webView;
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSDictionary)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(bounces, _webView.scrollView.bounces, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(scrollEnabled, _webView.scrollView.scrollEnabled, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(decelerationRate, _webView.scrollView.decelerationRate, CGFloat)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(scalesPageToFit, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(messagingEnabled, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(injectedJavaScript, NSString)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onMessage, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(onShouldStartLoadWithRequest, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(allowsInlineMediaPlayback, _webView.allowsInlineMediaPlayback, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(mediaPlaybackRequiresUserAction, _webView.mediaPlaybackRequiresUserAction, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(dataDetectorTypes, _webView.dataDetectorTypes, UIDataDetectorTypes)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(showsHorizontalScrollIndicator, _webView.scrollView.showsHorizontalScrollIndicator, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(showsVerticalScrollIndicator, _webView.scrollView.showsVerticalScrollIndicator, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(directionalLockEnabled, _webView.scrollView.directionalLockEnabled, BOOL)

ABI33_0_0RCT_EXPORT_METHOD(goBack:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RNCUIWebView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view goBack];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(goForward:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view goForward];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RNCUIWebView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view reload];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(stopLoading:(nonnull NSNumber *)ReactABI33_0_0Tag)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RNCUIWebView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view stopLoading];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(postMessage:(nonnull NSNumber *)ReactABI33_0_0Tag message:(NSString *)message)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RNCUIWebView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view postMessage:message];
    }
  }];
}

ABI33_0_0RCT_EXPORT_METHOD(injectJavaScript:(nonnull NSNumber *)ReactABI33_0_0Tag script:(NSString *)script)
{
  [self.bridge.uiManager addUIBlock:^(__unused ABI33_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, ABI33_0_0RNCUIWebView *> *viewRegistry) {
    ABI33_0_0RNCUIWebView *view = viewRegistry[ReactABI33_0_0Tag];
    if (![view isKindOfClass:[ABI33_0_0RNCUIWebView class]]) {
      ABI33_0_0RCTLogError(@"Invalid view returned from registry, expecting ABI33_0_0RNCUIWebView, got: %@", view);
    } else {
      [view injectJavaScript:script];
    }
  }];
}

#pragma mark - Exported synchronous methods

- (BOOL)webView:(__unused ABI33_0_0RNCUIWebView *)webView
shouldStartLoadForRequest:(NSMutableDictionary<NSString *, id> *)request
   withCallback:(ABI33_0_0RCTDirectEventBlock)callback
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
    ABI33_0_0RCTLogWarn(@"Did not receive response to shouldStartLoad in time, defaulting to YES");
    return YES;
  }
}

ABI33_0_0RCT_EXPORT_METHOD(startLoadWithResult:(BOOL)result lockIdentifier:(NSInteger)lockIdentifier)
{
  if ([_shouldStartLoadLock tryLockWhenCondition:lockIdentifier]) {
    _shouldStartLoad = result;
    [_shouldStartLoadLock unlockWithCondition:0];
  } else {
    ABI33_0_0RCTLogWarn(@"startLoadWithResult invoked with invalid lockIdentifier: "
               "got %lld, expected %lld", (long long)lockIdentifier, (long long)_shouldStartLoadLock.condition);
  }
}

@end
