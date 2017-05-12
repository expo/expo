// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXFrameManager.h"
#import "ABI17_0_0EXFrame.h"

#import <ReactABI17_0_0/ABI17_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI17_0_0EXFrameManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI17_0_0EXFrame alloc] init];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI17_0_0RCTDirectEventBlock);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI17_0_0RCTDirectEventBlock);

ABI17_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI17_0_0Tag)
{
  if (!ReactABI17_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI17_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI17_0_0EXFrame *view = viewRegistry[ReactABI17_0_0Tag];
    if (view) {
      ABI17_0_0RCTAssert([view isKindOfClass:[ABI17_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI17_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
