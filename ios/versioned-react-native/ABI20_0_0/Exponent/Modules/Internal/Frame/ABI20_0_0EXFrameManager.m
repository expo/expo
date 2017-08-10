// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXFrameManager.h"
#import "ABI20_0_0EXFrame.h"

#import <ReactABI20_0_0/ABI20_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI20_0_0EXFrameManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI20_0_0EXFrame alloc] init];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI20_0_0RCTDirectEventBlock);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI20_0_0RCTDirectEventBlock);

ABI20_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI20_0_0Tag)
{
  if (!ReactABI20_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI20_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI20_0_0EXFrame *view = viewRegistry[ReactABI20_0_0Tag];
    if (view) {
      ABI20_0_0RCTAssert([view isKindOfClass:[ABI20_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI20_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
