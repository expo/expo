// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXComponentDataCompatibleWrapper.h>

@interface RCTComponentData (EXComponentDataCompatibleWrapper)

// available in RN 0.65+
- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(RCTBridge *)bridge
                     eventDispatcher:(id<RCTEventDispatcherProtocol>) eventDispatcher;

- (instancetype)initWithManagerClass:(Class)managerClass bridge:(RCTBridge *)bridge;

@end

@implementation EXComponentDataCompatibleWrapper

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(RCTBridge *)bridge
                     eventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher
{
  if ([self respondsToSelector:@selector(initWithManagerClass:bridge:)]) {
    return [super initWithManagerClass:managerClass bridge:bridge];
  }
  return [super initWithManagerClass:managerClass bridge:bridge eventDispatcher:eventDispatcher];
}

@end
