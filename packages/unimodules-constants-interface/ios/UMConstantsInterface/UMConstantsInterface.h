// Copyright 2018-present 650 Industries. All rights reserved.

@protocol UMConstantsInterface

@property (nonatomic, readonly) NSString *appOwnership;

- (NSDictionary *)constants;

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
