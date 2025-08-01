// Copyright 2021-present 650 Industries. All rights reserved.

#import "RCTComponentData+Privates.h"

@class RCTBridge;
@protocol RCTEventDispatcherProtocol;

@implementation RCTComponentDataSwiftAdapter

- (nonnull instancetype)initWithManagerClass:(nonnull Class)managerClass
                                      bridge:(nonnull RCTBridge *)bridge
                             eventDispatcher:(nullable id<RCTEventDispatcherProtocol>)eventDispatcher
{
  return [super initWithManagerClass:managerClass bridge:bridge eventDispatcher:nil];
}

@end
