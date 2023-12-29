// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

typedef void (^EXVerifySignatureSuccessBlock)(BOOL isValid);
typedef void (^EXVerifySignatureErrorBlock)(NSError *error);

@interface EXApiUtil : NSObject

+ (NSURL *)bundleUrlFromManifest:(EXManifestsManifest *)manifest;
+ (NSURL *)encodedUrlFromString:(NSString *)urlString;

@end

NS_ASSUME_NONNULL_END
