// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <EXCore/EXInternalModule.h>
#import <EXConstantsInterface/EXConstantsInterface.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXConstantsService : NSObject <EXInternalModule, EXConstantsInterface>

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
