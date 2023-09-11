// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXInternalModule.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const ABI47_0_0EXConstantsExecutionEnvironmentBare;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXConstantsExecutionEnvironmentStandalone;
FOUNDATION_EXPORT NSString * const ABI47_0_0EXConstantsExecutionEnvironmentStoreClient;

@interface ABI47_0_0EXConstantsService : NSObject <ABI47_0_0EXInternalModule, ABI47_0_0EXConstantsInterface>

- (NSString *)buildVersion;
- (CGFloat)statusBarHeight;
- (NSString *)iosVersion;
- (NSString *)userInterfaceIdiom;
- (BOOL)isDevice;
- (NSArray<NSString *> *)systemFontNames;

+ (NSString *)devicePlatform;
+ (nullable NSString *)deviceModel;
+ (NSNumber *)deviceYear;
+ (NSString *)deviceName;

@end

NS_ASSUME_NONNULL_END
