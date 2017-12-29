// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXFrameManager.h"
#import "ABI21_0_0EXFrame.h"

#import <ReactABI21_0_0/ABI21_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI21_0_0EXFrameManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI21_0_0EXFrame alloc] init];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI21_0_0RCTDirectEventBlock);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI21_0_0RCTDirectEventBlock);

ABI21_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI21_0_0Tag)
{
  if (!ReactABI21_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI21_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI21_0_0EXFrame *view = viewRegistry[ReactABI21_0_0Tag];
    if (view) {
      ABI21_0_0RCTAssert([view isKindOfClass:[ABI21_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI21_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
