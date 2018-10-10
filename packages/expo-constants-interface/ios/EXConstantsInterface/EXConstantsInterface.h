// Copyright 2018-present 650 Industries. All rights reserved.

@protocol EXConstantsInterface

@property (nonatomic, readonly) NSString *appOwnership;
@property (nonatomic, readonly) NSString *experienceId;

- (NSDictionary *)constants;

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
