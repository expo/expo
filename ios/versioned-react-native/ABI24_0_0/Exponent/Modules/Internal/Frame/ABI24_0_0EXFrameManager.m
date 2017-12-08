// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXFrameManager.h"
#import "ABI24_0_0EXFrame.h"

#import <ReactABI24_0_0/ABI24_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI24_0_0EXFrameManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI24_0_0EXFrame alloc] init];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI24_0_0RCTDirectEventBlock);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, ABI24_0_0RCTDirectEventBlock);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI24_0_0RCTDirectEventBlock);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI24_0_0RCTDirectEventBlock);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI24_0_0RCTDirectEventBlock);

ABI24_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI24_0_0Tag)
{
  if (!ReactABI24_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI24_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI24_0_0EXFrame *view = viewRegistry[ReactABI24_0_0Tag];
    if (view) {
      ABI24_0_0RCTAssert([view isKindOfClass:[ABI24_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI24_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
