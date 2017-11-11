// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXFrameManager.h"
#import "ABI23_0_0EXFrame.h"

#import <ReactABI23_0_0/ABI23_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI23_0_0EXFrameManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI23_0_0EXFrame alloc] init];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI23_0_0RCTDirectEventBlock);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI23_0_0RCTDirectEventBlock);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI23_0_0RCTDirectEventBlock);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI23_0_0RCTDirectEventBlock);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI23_0_0RCTDirectEventBlock);

ABI23_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI23_0_0Tag)
{
  if (!ReactABI23_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI23_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI23_0_0EXFrame *view = viewRegistry[ReactABI23_0_0Tag];
    if (view) {
      ABI23_0_0RCTAssert([view isKindOfClass:[ABI23_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI23_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
