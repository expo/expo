// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXVersions : NSObject

+ (nonnull instancetype)sharedInstance;

@property (nonatomic, readonly, nonnull) NSDictionary *versions;
@property (nonatomic, readonly, nonnull) NSString *temporarySdkVersion;

- (NSString *)symbolPrefixForSdkVersion: (NSString * _Nullable)version isKernel:(BOOL)isKernel;
- (NSString *)availableSdkVersionForManifest: (NSDictionary * _Nullable)manifest;
+ (NSString * _Nullable)versionedString: (NSString * _Nullable)string withPrefix: (NSString * _Nullable)symbolPrefix;

@end

NS_ASSUME_NONNULL_END
