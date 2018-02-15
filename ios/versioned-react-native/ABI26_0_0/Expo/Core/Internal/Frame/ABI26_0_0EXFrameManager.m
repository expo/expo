// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXFrameManager.h"
#import "ABI26_0_0EXFrame.h"

#import <ReactABI26_0_0/ABI26_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI26_0_0EXFrameManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI26_0_0EXFrame alloc] init];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI26_0_0RCTDirectEventBlock);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI26_0_0RCTDirectEventBlock);

ABI26_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI26_0_0Tag)
{
  if (!ReactABI26_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI26_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI26_0_0EXFrame *view = viewRegistry[ReactABI26_0_0Tag];
    if (view) {
      ABI26_0_0RCTAssert([view isKindOfClass:[ABI26_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI26_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
