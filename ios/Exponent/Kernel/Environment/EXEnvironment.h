// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXTest.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const kEXEmbeddedBundleResourceName;
FOUNDATION_EXPORT NSString * const kEXEmbeddedManifestResourceName;

@interface EXEnvironment : NSObject

+ (instancetype)sharedEnvironment;

/**
 *  Whether the app was built with a Debug configuration.
 */
@property (nonatomic, readonly) BOOL isDebugXCodeScheme;

/**
 *  The custom url scheme for the standalone app (if isDetached == true).
 */
@property (nonatomic, readonly, nullable) NSString *urlScheme;

/**
 *  The `bundleUrl` given by the embedded manifest that shipped with this NSBundle, if any.
 */
@property (nonatomic, readonly) NSString * _Nullable embeddedBundleUrl;

/**
 *  Contains `standaloneManifestUrl`, and may also contain a local development url for a detached project.
 */
@property (nonatomic, readonly, nonnull) NSArray *allManifestUrls;

/**
 *  Whether the app is running in a test environment (local Xcode test target, CI, or not at all).
 */
@property (nonatomic, assign) EXTestEnvironment testEnvironment;

/**
 *  True if the given string is not null and equals self.urlScheme
 */
- (BOOL)isStandaloneUrlScheme:(NSString *)scheme;

/**
 *  True if urlScheme is nonnull.
 */
- (BOOL)hasUrlScheme;

@end

NS_ASSUME_NONNULL_END
