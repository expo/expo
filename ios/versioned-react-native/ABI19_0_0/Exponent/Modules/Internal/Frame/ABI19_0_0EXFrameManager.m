// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXFrameManager.h"
#import "ABI19_0_0EXFrame.h"

#import <ReactABI19_0_0/ABI19_0_0RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation ABI19_0_0EXFrameManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[ABI19_0_0EXFrame alloc] init];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, ABI19_0_0RCTDirectEventBlock);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, ABI19_0_0RCTDirectEventBlock);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onLoadingError, ABI19_0_0RCTDirectEventBlock);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(onError, ABI19_0_0RCTDirectEventBlock);

ABI19_0_0RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)ReactABI19_0_0Tag)
{
  if (!ReactABI19_0_0Tag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(ABI19_0_0RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    ABI19_0_0EXFrame *view = viewRegistry[ReactABI19_0_0Tag];
    if (view) {
      ABI19_0_0RCTAssert([view isKindOfClass:[ABI19_0_0EXFrame class]], @"Invalid view returned from registry; expected ABI19_0_0EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
