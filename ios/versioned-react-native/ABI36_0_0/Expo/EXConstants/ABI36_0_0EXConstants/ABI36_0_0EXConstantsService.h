// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMInternalModule.h>
#import <ABI36_0_0UMConstantsInterface/ABI36_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0EXConstantsService : NSObject <ABI36_0_0UMInternalModule, ABI36_0_0UMConstantsInterface>

- (NSString *)buildVersion;
- (CGFloat)statusBarHeight;
- (NSString *)iosVersion;
- (NSString *)userInterfaceIdiom;
- (BOOL)isDevice;
- (NSArray<NSString *> *)systemFontNames;

+ (NSString *)devicePlatform;
+ (NSString *)deviceModel;
+ (NSNumber *)deviceYear;
+ (NSString *)deviceName;
+ (NSString *)installationId;

@end

NS_ASSUME_NONNULL_END
