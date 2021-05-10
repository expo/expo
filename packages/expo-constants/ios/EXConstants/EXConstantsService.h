// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMInternalModule.h>
#import <UMConstantsInterface/UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXConstantsExecutionEnvironmentBare;
FOUNDATION_EXPORT NSString * const EXConstantsExecutionEnvironmentStandalone;
FOUNDATION_EXPORT NSString * const EXConstantsExecutionEnvironmentStoreClient;

@interface EXConstantsService : NSObject <UMInternalModule, UMConstantsInterface>

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
