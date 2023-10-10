#import <Foundation/Foundation.h>

@interface EXEnvironmentMocks : NSObject

/**
 *  Load mock configuration for Expo Go.
 */
+ (void)loadExpoClientConfig;

/**
 *  Load mock configuration for native component list as dev detached xdl should write it.
 */
+ (void)loadDevConfig;

@end
