// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTComponentData.h>

/**
 * A compatible wrapper for `RCTComponentData` which has different designated initializers between different react-native versions.
 * This class unifies the interface to make react-native <= 0.64 backward compatible.
 * Remove when we drop support for SDK 44
 */
@interface EXComponentDataCompatibleWrapper : RCTComponentData

- (instancetype)initWithManagerClass:(Class)managerClass
                              bridge:(RCTBridge *)bridge
                     eventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher NS_DESIGNATED_INITIALIZER;

@end
