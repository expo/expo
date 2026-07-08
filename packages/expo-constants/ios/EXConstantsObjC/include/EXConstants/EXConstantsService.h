// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const EXConstantsExecutionEnvironmentBare;
FOUNDATION_EXPORT NSString * const EXConstantsExecutionEnvironmentStoreClient;

@interface EXConstantsService : NSObject <EXInternalModule, EXConstantsInterface>

- (NSString *)buildVersion;
- (CGFloat)statusBarHeight;
- (NSArray<NSString *> *)systemFontNames;
+ (NSNumber *)deviceYear;
+ (NSString *)deviceName;

@end

NS_ASSUME_NONNULL_END
