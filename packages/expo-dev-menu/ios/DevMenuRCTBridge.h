// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge+Private.h>

#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface DevMenuRCTCxxBridge : RCTCxxBridge

- (NSArray<Class> *)filterModuleList:(NSArray<Class> *)modules;

@end

@interface DevMenuRCTBridge : RCTBridge

- (Class)bridgeClass;

@end

@interface DevMenuRCTAppDelegate : RCTAppDelegate

- (void)createBridgeAndSetAdapterWithLaunchOptions:(NSDictionary *_Nullable)launchOptions;

@end

NS_ASSUME_NONNULL_END
