#import <Foundation/Foundation.h>

@interface EXEnvironmentMocks : NSObject

/**
 *  Load mock configuration for expo client. (no ExpoKit config at all)
 */
+ (void)loadExpoClientConfig;

/**
 *  Load mock configuration for native component list as dev detached xdl should write it.
 */
+ (void)loadDevDetachConfig;

/**
 *  Load mock configuration for native component list as production turtle should write it.
 */
+ (void)loadProdServiceConfig;

/**
 *  Return a mock of EXShell.plist
 */
+ (NSMutableDictionary *)shellConfig;

/**
 *  Return a mock of Info.plist
 */
+ (NSMutableDictionary *)infoPlist;

/**
 *  Return a mock of an embedded shell manifest
 */
+ (NSDictionary *)embeddedManifest;

/**
 *  Return a mock of an app's prod custom url scheme
 */
+ (NSString *)prodUrlScheme;

/**
 *  Return a mock of an ExpoKit dev url
 */
+ (NSString *)expoKitDevUrl;

@end
