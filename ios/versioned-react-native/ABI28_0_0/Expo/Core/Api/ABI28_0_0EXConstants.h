// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXScopedBridgeModule.h"
#import "ABI28_0_0EXScopedModuleRegistry.h"

@interface ABI28_0_0EXConstants : ABI28_0_0EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

+ (NSString *)devicePlatform;
+ (NSString *)deviceModel;
+ (NSNumber *)deviceYear;
+ (NSString *)deviceName;

@end

ABI28_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI28_0_0EXConstants, constants)
