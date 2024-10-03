// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <React/RCTLog.h>
#import <React/RCTBridge.h>

#import "EXVersionUtils.h"

@class EXManifestsManifest;

@interface EXVersionManagerObjC : NSObject

- (nonnull instancetype)initWithParams:(nonnull NSDictionary *)params
                              manifest:(nonnull EXManifestsManifest *)manifest
                          fatalHandler:(void (^ _Nonnull)(NSError * _Nullable))fatalHandler
                           logFunction:(nonnull RCTLogFunction)logFunction
                          logThreshold:(RCTLogLevel)logThreshold;

- (void)hostDidStart:(id)instance;
- (void)hostFinishedLoading:(id)host;
- (void)invalidate;

/**
 *  Dev tools (implementation varies by SDK)
 */
- (void)showDevMenuForHost:(id)host;
- (void)disableRemoteDebuggingForHost:(id)host;
- (void)toggleRemoteDebuggingForHost:(id)host;
- (void)togglePerformanceMonitorForHost:(id)host;
- (void)toggleElementInspectorForHost:(id)host;
- (uint32_t)addWebSocketNotificationHandler:(void (^)(NSDictionary<NSString *, id> *))handler
                         queue:(dispatch_queue_t)queue
                     forMethod:(NSString *)method;

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForHost:(id)host;
- (void)selectDevMenuItemWithKey:(NSString *)key host:(id)host bundleURL:(NSURL *)bundleURL;

/**
 *  Provides the extra native modules required to set up a bridge with this version.
 */
- (NSArray *)extraModules;

- (void *)versionedJsExecutorFactoryForBridge:(id)bridge;

- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

- (Class)getModuleClassFromName:(const char *)name;

@end
