// Copyright 2021-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/RCTComponentData+Privates.h>
#if __has_include(<React/React-Core-umbrella.h>)
  #import <React/React-Core-umbrella.h>
#else
  #import <React_Core/React_Core-umbrella.h>
#endif

@implementation RCTComponentDataSwiftAdapter

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull RCTBridge *)bridge
                             eventDispatcher:(nullable id<RCTEventDispatcherProtocol>)eventDispatcher
{
  return [super initWithManagerClass:managerClass bridge:bridge eventDispatcher:nil];
}

@end
