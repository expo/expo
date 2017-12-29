// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXFrameManager.h"
#import "ABI22_0_0EXFrame.h"

#import <ReactABI22_0_0/ABI22_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI22_0_0EXFrameManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI22_0_0EXFrame alloc] init];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI22_0_0RCTDirectEventBlock);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI22_0_0RCTDirectEventBlock);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI22_0_0RCTDirectEventBlock);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI22_0_0RCTDirectEventBlock);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI22_0_0RCTDirectEventBlock);

ABI22_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI22_0_0Tag)
{
  if (!ReactABI22_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI22_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI22_0_0EXFrame *view = viewRegistry[ReactABI22_0_0Tag];
    if (view) {
      ABI22_0_0RCTAssert([view isKindOfClass:[ABI22_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI22_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
