// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI14_0_0EXFrameManager.h"
#import "ABI14_0_0EXFrame.h"

#import <ReactABI14_0_0/ABI14_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI14_0_0EXFrameManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI14_0_0EXFrame alloc] init];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI14_0_0RCTDirectEventBlock);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI14_0_0RCTDirectEventBlock);

ABI14_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI14_0_0Tag)
{
  if (!ReactABI14_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI14_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI14_0_0EXFrame *view = viewRegistry[ReactABI14_0_0Tag];
    if (view) {
      ABI14_0_0RCTAssert([view isKindOfClass:[ABI14_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI14_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
