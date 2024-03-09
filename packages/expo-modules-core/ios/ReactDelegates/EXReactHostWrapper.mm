// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXReactHostWrapper.h>

#import <ExpoModulesCore/EXReactHostWrapper+Private.h>

@implementation EXReactHostWrapper {
#if RCT_NEW_ARCH_ENABLED
  RCTHost *_host;
#endif
  RCTBridge *_bridge;
}

#if RCT_NEW_ARCH_ENABLED
- (instancetype)initWithRCTHost:(RCTHost *)host
{
  if (self = [self init]) {
    _host = host;
  }
  return self;
}
#endif

- (instancetype)initWithRCTBridge:(RCTBridge *)bridge
{
  if (self = [self init]) {
    _bridge = bridge;
  }
  return self;
}

- (id)get
{
#if RCT_NEW_ARCH_ENABLED
  if (_host != nil) {
    return _host;
  }
#endif
  return _bridge;
}

@end
