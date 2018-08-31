// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXConstantsInterface/ABI30_0_0EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI30_0_0EXConstantsService : NSObject <ABI30_0_0EXInternalModule, ABI30_0_0EXConstantsInterface>

@property (nonatomic, readonly) NSString *appOwnership;
@property (nonatomic, readonly) NSString *experienceId;

- (NSString *)buildNumber;
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
