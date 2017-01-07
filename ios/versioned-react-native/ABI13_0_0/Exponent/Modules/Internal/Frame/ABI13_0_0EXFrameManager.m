// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXFrameManager.h"
#import "ABI13_0_0EXFrame.h"

#import <ReactABI13_0_0/ABI13_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI13_0_0EXFrameManager

ABI13_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI13_0_0EXFrame alloc] init];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI13_0_0RCTDirectEventBlock);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI13_0_0RCTDirectEventBlock);

ABI13_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI13_0_0Tag)
{
  if (!ReactABI13_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI13_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI13_0_0EXFrame *view = viewRegistry[ReactABI13_0_0Tag];
    if (view) {
      ABI13_0_0RCTAssert([view isKindOfClass:[ABI13_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI13_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
