// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrameManager.h"
#import "EXFrame.h"

#import <React/RCTUIManager.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXFrameManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[EXFrame alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(initialUri, NSURL);
RCT_EXPORT_VIEW_PROPERTY(source, NSURL)
RCT_EXPORT_VIEW_PROPERTY(applicationKey, NSString) // deprecated
RCT_EXPORT_VIEW_PROPERTY(debuggerHostname, NSString)
RCT_EXPORT_VIEW_PROPERTY(debuggerPort, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(manifest, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(initialProps, NSDictionary);
RCT_EXPORT_VIEW_PROPERTY(onLoadingStart, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onLoadingProgress, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onLoadingFinish, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onLoadingError, RCTDirectEventBlock);
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock);

RCT_EXPORT_METHOD(reload:(nonnull NSNumber *)reactTag)
{
  if (!reactTag) {
    return;
  }

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, __kindof UIView *> *viewRegistry) {
    EXFrame *view = viewRegistry[reactTag];
    if (view) {
      RCTAssert([view isKindOfClass:[EXFrame class]], @"Invalid view returned from registry; expected EXFrame but got: %@", view);
      [view reload];
    }
  }];
}

@end

NS_ASSUME_NONNULL_END
