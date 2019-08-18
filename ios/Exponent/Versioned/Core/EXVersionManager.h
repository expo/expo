// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@interface EXVersionManager : NSObject

- (instancetype)initWithFatalHandler: (void (^)(NSError *))fatalHandler
                         logFunction: (void (^)(NSInteger level, NSInteger source, NSString *fileName, NSNumber *lineNumber, NSString *message))logFunction
                        logThreshold: (NSInteger)threshold;
- (void)bridgeWillStartLoading: (id)bridge;
- (void)bridgeFinishedLoading;
- (void)invalidate;

/**
 *  Dev tools (implementation varies by SDK)
 */
- (void)showDevMenuForBridge:(id)bridge;
- (void)disableRemoteDebuggingForBridge:(id)bridge;
- (void)toggleElementInspectorForBridge:(id)bridge;

- (NSDictionary<NSString *, NSString *> *)devMenuItemsForBridge:(id)bridge;
- (void)selectDevMenuItemWithKey:(NSString *)key onBridge:(id)bridge;

/**
 *  Provides the extra native modules required to set up a bridge with this version.
 *  Uses a params dict since the internal workings may change over time, but we want to keep the interface the same.
 */
- (NSArray *)extraModulesWithParams:(NSDictionary *)params;

@end
