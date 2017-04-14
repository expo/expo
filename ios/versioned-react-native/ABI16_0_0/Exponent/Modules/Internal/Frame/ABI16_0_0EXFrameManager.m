// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI16_0_0EXFrameManager.h"
#import "ABI16_0_0EXFrame.h"

#import <ReactABI16_0_0/ABI16_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI16_0_0EXFrameManager

ABI16_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI16_0_0EXFrame alloc] init];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI16_0_0RCTDirectEventBlock);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI16_0_0RCTDirectEventBlock);

ABI16_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI16_0_0Tag)
{
  if (!ReactABI16_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI16_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI16_0_0EXFrame *view = viewRegistry[ReactABI16_0_0Tag];
    if (view) {
      ABI16_0_0RCTAssert([view isKindOfClass:[ABI16_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI16_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
