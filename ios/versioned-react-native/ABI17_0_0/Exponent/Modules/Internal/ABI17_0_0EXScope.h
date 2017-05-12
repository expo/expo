// Copyright 2015-present 650 Industries. All rights reserved.

#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>
#import <ReactABI17_0_0/ABI17_0_0RCTBridgeModule.h>

/**
 * Provides a place to put variables scoped per-experience that are
 * easily accessible from all native modules through `self.bridge.exScope`
 */

@interface ABI17_0_0EXScope : NSObject <ABI17_0_0RCTBridgeModule>

@property (nonatomic, readonly) NSURL *initialUri;
@property (nonatomic, readonly) NSString *experienceId;
@property (nonatomic, readonly) NSString *documentDirectory;
@property (nonatomic, readonly) NSString *cachesDirectory;

- (instancetype)initWithParams:(NSDictionary *)params;

- (NSString *)scopedPathWithPath:(NSString *)path withOptions:(NSDictionary *)options;

@end

@interface ABI17_0_0RCTBridge (ABI17_0_0EXScope)

@property (nonatomic, readonly) ABI17_0_0EXScope *experienceScope;

@end
