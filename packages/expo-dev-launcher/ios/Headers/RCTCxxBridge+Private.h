// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge+Private.h>

@interface RCTCxxBridge (EXDevLauncherRCTCxxBridgePrivate)

@property (nonatomic, weak, readonly) RCTBridge *parentBridge;

- (NSArray<RCTModuleData *> *)_initializeModules:(NSArray<Class> *)modules
                               withDispatchGroup:(dispatch_group_t)dispatchGroup
                                lazilyDiscovered:(BOOL)lazilyDiscovered;

@end
