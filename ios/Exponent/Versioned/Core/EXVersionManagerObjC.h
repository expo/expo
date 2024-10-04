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

- (void)bridgeWillStartLoading:(id)bridge;
- (void)bridgeFinishedLoading:(id)bridge;
- (void)invalidate;

/**
 *  Dev tools (implementation varies by SDK)
 */
- (void)showDevMenuForBridge:(id)bridge;
- (void)disableRemoteDebuggingForBridge:(id)bridge;
- (void)toggleRemoteDebuggingForBridge:(id)bridge;
- (void)togglePerformanceMonitorForBridge:(id)bridge;
- (void)toggleElementInspectorForBridge:(id)bridge;
- (uint32_t)addWebSocketNotificationHandler:(void (^)(NSDictionary<NSString *, id> *))handler
                         queue:(dispatch_queue_t)queue
                     forMethod:(NSString *)method;

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge;
- (void)selectDevMenuItemWithKey:(NSString *)key onBridge:(id)bridge;

/**
 *  Provides the extra native modules required to set up a bridge with this version.
 */
- (NSArray *)extraModulesForBridge:(id)bridge;

- (void *)versionedJsExecutorFactoryForBridge:(id)bridge;

@end
