// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXFrameManager.h"
#import "ABI18_0_0EXFrame.h"

#import <ReactABI18_0_0/ABI18_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI18_0_0EXFrameManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI18_0_0EXFrame alloc] init];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI18_0_0RCTDirectEventBlock);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI18_0_0RCTDirectEventBlock);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI18_0_0RCTDirectEventBlock);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI18_0_0RCTDirectEventBlock);

ABI18_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI18_0_0Tag)
{
  if (!ReactABI18_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI18_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI18_0_0EXFrame *view = viewRegistry[ReactABI18_0_0Tag];
    if (view) {
      ABI18_0_0RCTAssert([view isKindOfClass:[ABI18_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI18_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
