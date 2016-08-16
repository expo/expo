// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXVersions : NSObject

+ (nonnull instancetype)sharedInstance;

@property (nonatomic, readonly, nonnull) NSDictionary *versions;

- (NSString *)symbolPrefixForManifest: (NSDictionary * _Nullable)manifest;
- (NSString *)versionForManifest: (NSDictionary * _Nullable)manifest;
+ (NSString * _Nullable)versionedString: (NSString * _Nullable)string withPrefix: (NSString * _Nullable)versionPrefix;

@end

NS_ASSUME_NONNULL_END
