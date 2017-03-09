// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXFrameManager.h"
#import "ABI15_0_0EXFrame.h"

#import <ReactABI15_0_0/ABI15_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI15_0_0EXFrameManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI15_0_0EXFrame alloc] init];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI15_0_0RCTDirectEventBlock);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI15_0_0RCTDirectEventBlock);

ABI15_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI15_0_0Tag)
{
  if (!ReactABI15_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI15_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI15_0_0EXFrame *view = viewRegistry[ReactABI15_0_0Tag];
    if (view) {
      ABI15_0_0RCTAssert([view isKindOfClass:[ABI15_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI15_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
