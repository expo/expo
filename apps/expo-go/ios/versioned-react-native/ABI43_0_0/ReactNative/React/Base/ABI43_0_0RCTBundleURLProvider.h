/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#if defined(__cplusplus)
extern "C" {
#endif

extern NSString *const ABI43_0_0RCTBundleURLProviderUpdatedNotification;

extern const NSUInteger kABI43_0_0RCTBundleURLProviderDefaultPort;

#if defined(__cplusplus)
}
#endif

@interface ABI43_0_0RCTBundleURLProvider : NSObject

/**
 * Set default settings on NSUserDefaults.
 */
- (void)setDefaults;

/**
 * Reset every settings to default.
 */
- (void)resetToDefaults;

/**
 * Return the server host. If its a development build and there's no jsLocation defined,
 * it will return the server host IP address
 */
- (NSString *)packagerServerHost;

/**
 * Return the server host with optional port. If its a development build and there's no jsLocation defined,
 * it will return the server host IP address
 */
- (NSString *)packagerServerHostPort;

/**
 * Returns if there's a packager running at the given host port.
 * The port is optional, if not specified, kABI43_0_0RCTBundleURLProviderDefaultPort will be used
 */
+ (BOOL)isPackagerRunning:(NSString *)hostPort;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 */
- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackURLProvider:(NSURL * (^)(void))fallbackURLProvider;

/**
 * Returns the jsBundleURL for a given split bundle entrypoint in development
 */
- (NSURL *)jsBundleURLForSplitBundleRoot:(NSString *)bundleRoot;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 * if resourceName or extension are nil, "main" and "jsbundle" will be
 * used, respectively.
 */
- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                   fallbackResource:(NSString *)resourceName
                  fallbackExtension:(NSString *)extension;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle if the packager is not running.
 */
- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName;

/**
 * Returns the jsBundleURL for a given bundle entrypoint and
 * the fallback offline JS bundle. If resourceName or extension
 * are nil, "main" and "jsbundle" will be used, respectively.
 */
- (NSURL *)jsBundleURLForFallbackResource:(NSString *)resourceName fallbackExtension:(NSString *)extension;

/**
 * Returns the resourceURL for a given bundle entrypoint and
 * the fallback offline resource file if the packager is not running.
 */
- (NSURL *)resourceURLForResourceRoot:(NSString *)root
                         resourceName:(NSString *)name
                    resourceExtension:(NSString *)extension
                        offlineBundle:(NSBundle *)offlineBundle;

/**
 * The IP address or hostname of the packager.
 */
@property (nonatomic, copy) NSString *jsLocation;

@property (nonatomic, assign) BOOL enableLiveReload;
@property (nonatomic, assign) BOOL enableMinification;
@property (nonatomic, assign) BOOL enableDev;

+ (instancetype)sharedSettings;

/**
 * Given a hostname for the packager and a bundle root, returns the URL to the js bundle. Generally you should use the
 * instance method -jsBundleURLForBundleRoot:fallbackResource: which includes logic to guess if the packager is running
 * and fall back to a pre-packaged bundle if it is not.
 *
 * The options here mirror some of Metro's Bundling Options:
 * - enableDev: Whether to keep or remove `__DEV__` blocks from the bundle.
 * - enableMinification: Enables or disables minification. Usually production bundles are minified and development
 *     bundles are not.
 * - modulesOnly: When true, will only send module definitions without polyfills and without the require-runtime.
 * - runModule: When true, will run the main module after defining all modules. This is used in the main bundle but not
 *     in split bundles.
 */
+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification;

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
                        modulesOnly:(BOOL)modulesOnly
                          runModule:(BOOL)runModule;

/**
 * Given a hostname for the packager and a resource path (including "/"), return the URL to the resource.
 * In general, please use the instance method to decide if the packager is running and fallback to the pre-packaged
 * resource if it is not: -resourceURLForResourceRoot:resourceName:resourceExtension:offlineBundle:
 */
+ (NSURL *)resourceURLForResourcePath:(NSString *)path packagerHost:(NSString *)packagerHost query:(NSString *)query;

@end
