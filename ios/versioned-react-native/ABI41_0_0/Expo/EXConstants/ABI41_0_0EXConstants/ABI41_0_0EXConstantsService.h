// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMConstantsInterface/ABI41_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const ABI41_0_0EXConstantsExecutionEnvironmentBare;
FOUNDATION_EXPORT NSString * const ABI41_0_0EXConstantsExecutionEnvironmentStandalone;
FOUNDATION_EXPORT NSString * const ABI41_0_0EXConstantsExecutionEnvironmentStoreClient;

@interface ABI41_0_0EXConstantsService : NSObject <ABI41_0_0UMInternalModule, ABI41_0_0UMConstantsInterface>

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
