// Copyright 2021-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/RCTComponentData+Privates.h>
#import <React/RCTComponentData.h>

@implementation RCTComponentDataSwiftAdapter

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull RCTBridge *)bridge
                             eventDispatcher:(nullable id<RCTEventDispatcherProtocol>)eventDispatcher
{
  return [super initWithManagerClass:managerClass bridge:bridge eventDispatcher:nil];
}

@end
