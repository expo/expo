// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXTest.h"

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString * const kEXEmbeddedBundleResourceName;
FOUNDATION_EXPORT NSString * const kEXEmbeddedManifestResourceName;

@interface EXEnvironment : NSObject

+ (instancetype)sharedEnvironment;

/**
 *  Whether the app is running as a detached/standalone app (true) or as a browser/Expo Client (false).
 */
@property (nonatomic, readonly) BOOL isDetached;

/**
 *  Whether the app was built with a Debug configuration.
 */
@property (nonatomic, readonly) BOOL isDebugXCodeScheme;

/**
 *  The manifest url of the standalone app (if isDetached == true).
 */
@property (nonatomic, readonly, nullable) NSString *standaloneManifestUrl;

/**
 *  The custom url scheme for the standalone app (if isDetached == true).
 */
@property (nonatomic, readonly, nullable) NSString *urlScheme;

/**
 *  The release channel from which to fetch the standalone app (if isDetached == true).
 */
@property (nonatomic, readonly, nonnull) NSString *releaseChannel;

/**
 *  The `bundleUrl` given by the embedded manifest that shipped with this NSBundle, if any.
 */
@property (nonatomic, readonly) NSString * _Nullable embeddedBundleUrl;

/**
 *  Contains `standaloneManifestUrl`, and may also contain a local development url for a detached project.
 */
@property (nonatomic, readonly, nonnull) NSArray *allManifestUrls;

/**
 *  True by default in ExpoKit apps created with `expo eject`, because the owner of the app needs to
 *  manually modify their App Id to enable keychain sharing.
 */
@property (nonatomic, readonly) BOOL isManifestVerificationBypassed;

/**
 *  Whether remote updates are allowed at all for this standalone app.
 */
@property (nonatomic, readonly) BOOL areRemoteUpdatesEnabled;

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
