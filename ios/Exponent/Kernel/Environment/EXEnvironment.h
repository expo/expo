// Copyright 2015-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import "EXTest.h"

NS_ASSUME_NONNULL_BEGIN

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
 *  The release channel from which to fetch the standalone app (if isDetached == true).
 */
@property (nonatomic, readonly, nonnull) NSString *releaseChannel;

/**
 *  The `bundleUrl` given by the embedded manifest that shipped with this NSBundle, if any.
 */
@property (nonatomic, readonly) NSString * _Nullable embeddedBundleUrl;

/**
 *  May contain a local development url for a detached project.
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
*  Whether to check for updates to this app automatically on launch. Applies to standalone apps only.
*/
@property (nonatomic, readonly) BOOL updatesCheckAutomatically;

/**
*  Timeout when checking for updates on launch after which to fall back to cache. Applies to standalone apps only.
*/
@property (nonatomic, readonly) NSNumber *updatesFallbackToCacheTimeout;

/**
 *  Whether the app is running in a test environment (local Xcode test target, CI, or not at all).
 */
@property (nonatomic, assign) EXTestEnvironment testEnvironment;

/**
 *  True if urlScheme is nonnull.
 */
- (BOOL)hasUrlScheme;

@end

NS_ASSUME_NONNULL_END
