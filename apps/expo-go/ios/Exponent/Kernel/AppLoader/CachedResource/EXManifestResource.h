// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXCachedResource.h"
#import <UIKit/UIFont.h>

@class EXManifestsManifest;

NS_ASSUME_NONNULL_BEGIN

extern NSString * const EXFixInstructionsKey;
extern NSString * const EXShowTryAgainButtonKey;

@interface EXManifestResource : EXCachedResource

- (instancetype)initWithResourceName:(NSString *)resourceName
                        resourceType:(NSString *)resourceType
                           remoteUrl:(NSURL *)url
                           cachePath:(NSString * _Nullable)cachePath NS_UNAVAILABLE;

/**
 *  @param manifestUrl the actual http url from which to download the manifest
 *  @param originalUrl whatever url the user originally requested
 */
- (instancetype)initWithManifestUrl:(NSURL *)url
                        originalUrl:(NSURL * _Nullable)originalUrl NS_DESIGNATED_INITIALIZER;

/**
 *  Manifests will not be cached implicitly as we want to wait until we've also
 *  downloaded the whole bundle. This method tells the ManifestResource it's safe to cache
 */
- (void)writeToCache;

- (NSError *)verifyManifestSdkVersion:(EXManifestsManifest *)maybeManifest;
- (NSError *)formatError:(NSError *)error;
+ (NSString * _Nonnull)formatHeader:(NSError * _Nonnull)error;
+ (NSAttributedString *)parseUrlsInAttributedString:(NSAttributedString *)inputString;
+ (NSAttributedString *)parseBoldInAttributedString:(NSAttributedString *)inputString withFont:(UIFont *)font;
+ (NSAttributedString *)parseUrlsAndBoldInAttributedString:(NSAttributedString *)inputString withFont:(UIFont *)font;

@end

NS_ASSUME_NONNULL_END
