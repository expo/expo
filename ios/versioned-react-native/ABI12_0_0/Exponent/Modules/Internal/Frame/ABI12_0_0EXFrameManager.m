// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXFrameManager.h"
#import "ABI12_0_0EXFrame.h"

#import "ABI12_0_0RCTUIManager.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ABI12_0_0EXFrameManager

ABI12_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI12_0_0EXFrame alloc] init];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI12_0_0RCTDirectEventBlock);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI12_0_0RCTDirectEventBlock);

ABI12_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI12_0_0Tag)
{
  if (!ReactABI12_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI12_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI12_0_0EXFrame *view = viewRegistry[ReactABI12_0_0Tag];
    if (view) {
      ABI12_0_0RCTAssert([view isKindOfClass:[ABI12_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI12_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
