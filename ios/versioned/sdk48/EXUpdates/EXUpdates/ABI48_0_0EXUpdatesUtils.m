//  Copyright © 2019 650 Industries. All rights reserved.

#import <CommonCrypto/CommonDigest.h>

#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdatesUtils.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <arpa/inet.h>

#if __has_include(<ABI48_0_0EXUpdates/ABI48_0_0EXUpdates-Swift.h>)
#import <ABI48_0_0EXUpdates/ABI48_0_0EXUpdates-Swift.h>
#else
#import "ABI48_0_0EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI48_0_0EXUpdatesEventName = @"Expo.nativeUpdatesEvent";
static NSString * const ABI48_0_0EXUpdatesUtilsErrorDomain = @"ABI48_0_0EXUpdatesUtils";

/**
 * Miscellaneous helper functions that are used by multiple classes in the library.
 */
@implementation ABI48_0_0EXUpdatesUtils

+ (void)runBlockOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

+ (NSString *)hexEncodedSHA256WithData:(NSData *)data
{
  uint8_t digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (CC_LONG)data.length, digest);

  NSMutableString *output = [NSMutableString stringWithCapacity:CC_SHA256_DIGEST_LENGTH * 2];
  for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++)
  {
    [output appendFormat:@"%02x", digest[i]];
  }

  return output;
}

+ (NSString *)base64UrlEncodedSHA256WithData:(NSData *)data
{
  uint8_t digest[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
  NSString *base64String = [[NSData dataWithBytes:digest length:CC_SHA256_DIGEST_LENGTH] base64EncodedStringWithOptions:0];

  // ref. https://datatracker.ietf.org/doc/html/rfc4648#section-5
  return [[[base64String
            stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"="]] // remove extra padding
           stringByReplacingOccurrencesOfString:@"+" withString:@"-"] // replace "+" character w/ "-"
          stringByReplacingOccurrencesOfString:@"/" withString:@"_"]; // replace "/" character w/ "_"
}

+ (nullable NSURL *)initializeUpdatesDirectoryWithError:(NSError ** _Nullable)error
{
  NSFileManager *fileManager = NSFileManager.defaultManager;
  NSURL *applicationDocumentsDirectory = [[fileManager URLsForDirectory:NSApplicationSupportDirectory inDomains:NSUserDomainMask] lastObject];
  NSURL *updatesDirectory = [applicationDocumentsDirectory URLByAppendingPathComponent:@".expo-internal"];
  NSString *updatesDirectoryPath = [updatesDirectory path];

  BOOL isDir;
  BOOL exists = [fileManager fileExistsAtPath:updatesDirectoryPath isDirectory:&isDir];
  if (exists) {
    if (!isDir) {
      *error = [NSError errorWithDomain:ABI48_0_0EXUpdatesUtilsErrorDomain code:1005 userInfo:@{NSLocalizedDescriptionKey: @"Failed to create the Updates Directory; a file already exists with the required directory name"}];
      return nil;
    }
  } else {
    NSError *err;
    BOOL wasCreated = [fileManager createDirectoryAtPath:updatesDirectoryPath withIntermediateDirectories:YES attributes:nil error:&err];
    if (!wasCreated) {
      *error = err;
      return nil;
    }
  }

  return updatesDirectory;
}

+ (void)sendEventToBridge:(nullable ABI48_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body
{
  if (bridge) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    mutableBody[@"type"] = eventType;
    [bridge enqueueJSCall:@"ABI48_0_0RCTDeviceEventEmitter.emit" args:@[ABI48_0_0EXUpdatesEventName, mutableBody]];
  } else {
    NSLog(@"ABI48_0_0EXUpdates: Could not emit %@ event. Did you set the bridge property on the controller singleton?", eventType);
  }
}

+ (BOOL)shouldCheckForUpdateWithConfig:(ABI48_0_0EXUpdatesConfig *)config
{
  switch (config.checkOnLaunch) {
    case ABI48_0_0EXUpdatesCheckAutomaticallyConfigNever:
      return NO;
    case ABI48_0_0EXUpdatesCheckAutomaticallyConfigErrorRecoveryOnly:
      // check will happen later on if there's an error
      return NO;
    case ABI48_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly: {
      struct sockaddr_in zeroAddress;
      bzero(&zeroAddress, sizeof(zeroAddress));
      zeroAddress.sin_len = sizeof(zeroAddress);
      zeroAddress.sin_family = AF_INET;

      SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);
      SCNetworkReachabilityFlags flags;
      SCNetworkReachabilityGetFlags(reachability, &flags);

      return (flags & kSCNetworkReachabilityFlagsIsWWAN) == 0;
    }
    case ABI48_0_0EXUpdatesCheckAutomaticallyConfigAlways:
    default:
      return YES;
  }
}

+ (NSString *)getRuntimeVersionWithConfig:(ABI48_0_0EXUpdatesConfig *)config
{
  // various places in the code assume that we have a nonnull runtimeVersion, so if the developer
  // hasn't configured either runtimeVersion or sdkVersion, we'll use a dummy value of "1" but warn
  // the developer in JS that they need to configure one of these values
  return config.runtimeVersion ?: config.sdkVersion ?: @"1";
}

+ (NSURL *)urlForBundledAsset:(ABI48_0_0EXUpdatesAsset *)asset
{
  return asset.mainBundleDir
    ? [[NSBundle mainBundle] URLForResource:asset.mainBundleFilename withExtension:asset.type subdirectory:asset.mainBundleDir]
    : [[NSBundle mainBundle] URLForResource:asset.mainBundleFilename withExtension:asset.type];
}

+ (NSString *)pathForBundledAsset:(ABI48_0_0EXUpdatesAsset *)asset
{
  return asset.mainBundleDir
    ? [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type inDirectory:asset.mainBundleDir]
    : [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type];
}

// Purges entries in the expo-updates log file that are older than 1 day
+ (void)purgeUpdatesLogsOlderThanOneDay
{
  ABI48_0_0EXUpdatesLogReader *logReader = [ABI48_0_0EXUpdatesLogReader new];
  [logReader purgeLogEntries:^(NSError *error) {
    if (error) {
      NSLog(@"ABI48_0_0EXUpdatesUtils: error in purgeOldUpdatesLogs: %@", [error localizedDescription]);
    }
  }];
}

+ (BOOL)isNativeDebuggingEnabled
{
#if ABI48_0_0EX_UPDATES_NATIVE_DEBUG
  return YES;
#else
  return NO;
#endif
}

@end

NS_ASSUME_NONNULL_END
