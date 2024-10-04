//  Copyright © 2019 650 Industries. All rights reserved.

#import <CommonCrypto/CommonDigest.h>

#import <EXUpdates/EXUpdatesUtils.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <arpa/inet.h>

#if __has_include(<EXUpdates/EXUpdates-Swift.h>)
#import <EXUpdates/EXUpdates-Swift.h>
#else
#import "EXUpdates-Swift.h"
#endif

NS_ASSUME_NONNULL_BEGIN

static NSString * const EXUpdatesEventName = @"Expo.nativeUpdatesEvent";
static NSString * const EXUpdatesUtilsErrorDomain = @"EXUpdatesUtils";

/**
 * Miscellaneous helper functions that are used by multiple classes in the library.
 */
@implementation EXUpdatesUtils

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
      *error = [NSError errorWithDomain:EXUpdatesUtilsErrorDomain code:1005 userInfo:@{NSLocalizedDescriptionKey: @"Failed to create the Updates Directory; a file already exists with the required directory name"}];
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

+ (void)sendEventToBridge:(nullable RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body
{
  if (bridge) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    mutableBody[@"type"] = eventType;
    [bridge enqueueJSCall:@"RCTDeviceEventEmitter.emit" args:@[EXUpdatesEventName, mutableBody]];
  } else {
    NSLog(@"EXUpdates: Could not emit %@ event. Did you set the bridge property on the controller singleton?", eventType);
  }
}

+ (BOOL)shouldCheckForUpdateWithConfig:(EXUpdatesConfig *)config
{
  switch (config.checkOnLaunch) {
    case EXUpdatesCheckAutomaticallyConfigNever:
      return NO;
    case EXUpdatesCheckAutomaticallyConfigErrorRecoveryOnly:
      // check will happen later on if there's an error
      return NO;
    case EXUpdatesCheckAutomaticallyConfigWifiOnly: {
      struct sockaddr_in zeroAddress;
      bzero(&zeroAddress, sizeof(zeroAddress));
      zeroAddress.sin_len = sizeof(zeroAddress);
      zeroAddress.sin_family = AF_INET;

      SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);
      SCNetworkReachabilityFlags flags;
      SCNetworkReachabilityGetFlags(reachability, &flags);

      return (flags & kSCNetworkReachabilityFlagsIsWWAN) == 0;
    }
    case EXUpdatesCheckAutomaticallyConfigAlways:
    default:
      return YES;
  }
}

+ (NSString *)getRuntimeVersionWithConfig:(EXUpdatesConfig *)config
{
  // various places in the code assume that we have a nonnull runtimeVersion, so if the developer
  // hasn't configured either runtimeVersion or sdkVersion, we'll use a dummy value of "1" but warn
  // the developer in JS that they need to configure one of these values
  return config.runtimeVersion ?: config.sdkVersion ?: @"1";
}

+ (NSURL *)urlForBundledAsset:(EXUpdatesAsset *)asset
{
  return asset.mainBundleDir
    ? [[NSBundle mainBundle] URLForResource:asset.mainBundleFilename withExtension:asset.type subdirectory:asset.mainBundleDir]
    : [[NSBundle mainBundle] URLForResource:asset.mainBundleFilename withExtension:asset.type];
}

+ (NSString *)pathForBundledAsset:(EXUpdatesAsset *)asset
{
  return asset.mainBundleDir
    ? [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type inDirectory:asset.mainBundleDir]
    : [[NSBundle mainBundle] pathForResource:asset.mainBundleFilename ofType:asset.type];
}

// Purges entries in the expo-updates log file that are older than 1 day
+ (void)purgeUpdatesLogsOlderThanOneDay
{
  EXUpdatesLogReader *logReader = [EXUpdatesLogReader new];
  [logReader purgeLogEntries:^(NSError *error) {
    if (error) {
      NSLog(@"EXUpdatesUtils: error in purgeOldUpdatesLogs: %@", [error localizedDescription]);
    }
  }];
}

+ (BOOL)isNativeDebuggingEnabled
{
#if EX_UPDATES_NATIVE_DEBUG
  return YES;
#else
  return NO;
#endif
}

@end

NS_ASSUME_NONNULL_END
