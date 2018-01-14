// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXFrameManager.h"
#import "ABI25_0_0EXFrame.h"

#import <ReactABI25_0_0/ABI25_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI25_0_0EXFrameManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI25_0_0EXFrame alloc] init];
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI25_0_0RCTDirectEventBlock);
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI25_0_0RCTDirectEventBlock);

ABI25_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI25_0_0Tag)
{
  if (!ReactABI25_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI25_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI25_0_0EXFrame *view = viewRegistry[ReactABI25_0_0Tag];
    if (view) {
      ABI25_0_0RCTAssert([view isKindOfClass:[ABI25_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI25_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
