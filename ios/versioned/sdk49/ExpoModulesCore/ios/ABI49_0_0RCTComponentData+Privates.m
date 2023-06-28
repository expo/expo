// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0RCTComponentData+Privates.h>
#import <ABI49_0_0React/ABI49_0_0RCTComponentData.h>

@implementation ABI49_0_0RCTComponentDataSwiftAdapter

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull ABI49_0_0RCTBridge *)bridge
                             eventDispatcher:(nullable id<ABI49_0_0RCTEventDispatcherProtocol>)eventDispatcher
{
  return [super initWithManagerClass:managerClass bridge:bridge eventDispatcher:nil];
}

@end
