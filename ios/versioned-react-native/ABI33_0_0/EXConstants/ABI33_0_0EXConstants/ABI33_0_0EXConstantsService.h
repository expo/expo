// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMConstantsInterface/ABI33_0_0UMConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI33_0_0EXConstantsService : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMConstantsInterface>

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

@end

NS_ASSUME_NONNULL_END
