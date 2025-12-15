// Copyright 2024-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXHostWrapper.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <ReactCommon/RCTHost.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTMountingManager.h>
#import <React/RCTComponentViewRegistry.h>
#endif

@implementation EXHostWrapper {
#ifdef RCT_NEW_ARCH_ENABLED
  __weak RCTHost *_host;
#endif
}

- (instancetype)initWithHost:(RCTHost *)host
{
  if (self = [super init]) {
#ifdef RCT_NEW_ARCH_ENABLED
    _host = host;
#endif
  }
  return self;
}

- (nullable UIView *)findViewWithTag:(NSInteger)tag
{
#ifdef RCT_NEW_ARCH_ENABLED
  RCTComponentViewRegistry *componentViewRegistry = _host.surfacePresenter.mountingManager.componentViewRegistry;
  return [componentViewRegistry findComponentViewWithTag:tag];
#else
  return nil;
#endif
}

@end
