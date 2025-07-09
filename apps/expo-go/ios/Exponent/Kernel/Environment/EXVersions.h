// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

@interface EXVersions : NSObject

+ (nonnull instancetype)sharedInstance;

@property (nonatomic, readonly, nonnull) NSString *sdkVersion;

- (NSString *)availableSdkVersionForManifest: (EXManifestsManifest * _Nullable)manifest;
- (BOOL)supportsVersion:(NSString *)sdkVersion;

@end

NS_ASSUME_NONNULL_END
