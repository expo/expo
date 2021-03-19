// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0React/ABI41_0_0RCTLog.h>

@interface ABI41_0_0EXVersionManager : NSObject

// Uses a params dict since the internal workings may change over time, but we want to keep the interface the same.
- (instancetype)initWithParams: (NSDictionary *)params
                  fatalHandler: (void (^)(NSError *))fatalHandler
                   logFunction: (ABI41_0_0RCTLogFunction)logFunction
                  logThreshold: (NSInteger)threshold;
- (void)bridgeWillStartLoading: (id)bridge;
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

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge;
- (void)selectDevMenuItemWithKey:(NSString *)key onBridge:(id)bridge;

/**
 *  Provides the extra native modules required to set up a bridge with this version.
 */
- (NSArray *)extraModulesForBridge:(id)bridge;

- (void *)versionedJsExecutorFactoryForBridge:(id)bridge;

@end
