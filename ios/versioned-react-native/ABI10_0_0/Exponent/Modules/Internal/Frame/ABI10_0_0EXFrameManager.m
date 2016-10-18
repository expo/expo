// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXFrameManager.h"
#import "ABI10_0_0EXFrame.h"

#import "ABI10_0_0RCTUIManager.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ABI10_0_0EXFrameManager

ABI10_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI10_0_0EXFrame alloc] init];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI10_0_0RCTDirectEventBlock);
ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI10_0_0RCTDirectEventBlock);

ABI10_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)reactTag)
{
  if (!reactTag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI10_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI10_0_0EXFrame *view = viewRegistry[reactTag];
    if (view) {
      ABI10_0_0RCTAssert([view isKindOfClass:[ABI10_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI10_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
