// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>

/**
 * Provides a place to put variables scoped per-experience that are
 * easily accessible from all native modules through `self.bridge.exScope`
 */

@interface EXScope : NSObject <RCTBridgeModule>

@property (nonatomic, readonly) NSURL *initialUri;
@property (nonatomic, readonly) NSString *experienceId;

- (instancetype)initWithParams:(NSDictionary *)params;

@end

@interface RCTBridge (EXScope)

@property (nonatomic, readonly) EXScope *experienceScope;

@end
