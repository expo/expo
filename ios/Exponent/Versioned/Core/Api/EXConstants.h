// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

@interface EXConstants : EXScopedBridgeModule

@property (nonatomic, readonly) NSString *appOwnership;

+ (NSString *)devicePlatform;
+ (NSString *)deviceModel;
+ (NSNumber *)deviceYear;
+ (NSString *)deviceName;

@end

EX_DECLARE_SCOPED_MODULE_GETTER(EXConstants, constants)
