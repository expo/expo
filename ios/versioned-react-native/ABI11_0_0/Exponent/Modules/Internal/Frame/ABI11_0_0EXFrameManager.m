// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXFrameManager.h"
#import "ABI11_0_0EXFrame.h"

#import "ABI11_0_0RCTUIManager.h"

NS_ASSUME_NONNULL_BEGIN

@implementation ABI11_0_0EXFrameManager

ABI11_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI11_0_0EXFrame alloc] init];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI11_0_0RCTDirectEventBlock);
ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI11_0_0RCTDirectEventBlock);

ABI11_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI11_0_0Tag)
{
  if (!ReactABI11_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI11_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI11_0_0EXFrame *view = viewRegistry[ReactABI11_0_0Tag];
    if (view) {
      ABI11_0_0RCTAssert([view isKindOfClass:[ABI11_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI11_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
