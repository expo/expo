//  Copyright © 2019 650 Industries. All rights reserved.

#import <CommonCrypto/CommonDigest.h>

#import <ABI42_0_0EXUpdates/ABI42_0_0EXUpdatesUtils.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <arpa/inet.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI42_0_0EXUpdatesEventName = @"Expo.nativeUpdatesEvent";
static NSString * const ABI42_0_0EXUpdatesUtilsErrorDomain = @"ABI42_0_0EXUpdatesUtils";

@implementation ABI42_0_0EXUpdatesUtils

+ (void)runBlockOnMainThread:(void (^)(void))block
{
  if ([NSThread isMainThread]) {
    block();
  } else {
    dispatch_async(dispatch_get_main_queue(), block);
  }
}

+ (NSString *)sha256WithData:(NSData *)data
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
      *error = [NSError errorWithDomain:ABI42_0_0EXUpdatesUtilsErrorDomain code:1005 userInfo:@{NSLocalizedDescriptionKey: @"Failed to create the Updates Directory; a file already exists with the required directory name"}];
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

+ (void)sendEventToBridge:(nullable ABI42_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body
{
  if (bridge) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    mutableBody[@"type"] = eventType;
    [bridge enqueueJSCall:@"ABI42_0_0RCTDeviceEventEmitter.emit" args:@[ABI42_0_0EXUpdatesEventName, mutableBody]];
  } else {
    NSLog(@"ABI42_0_0EXUpdates: Could not emit %@ event. Did you set the bridge property on the controller singleton?", eventType);
  }
}

+ (BOOL)shouldCheckForUpdateWithConfig:(ABI42_0_0EXUpdatesConfig *)config
{
  switch (config.checkOnLaunch) {
    case ABI42_0_0EXUpdatesCheckAutomaticallyConfigNever:
      return NO;
    case ABI42_0_0EXUpdatesCheckAutomaticallyConfigWifiOnly: {
      struct sockaddr_in zeroAddress;
      bzero(&zeroAddress, sizeof(zeroAddress));
      zeroAddress.sin_len = sizeof(zeroAddress);
      zeroAddress.sin_family = AF_INET;

      SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);
      SCNetworkReachabilityFlags flags;
      SCNetworkReachabilityGetFlags(reachability, &flags);

      return (flags & kSCNetworkReachabilityFlagsIsWWAN) == 0;
    }
    case ABI42_0_0EXUpdatesCheckAutomaticallyConfigAlways:
    default:
      return YES;
  }
}

+ (NSString *)getRuntimeVersionWithConfig:(ABI42_0_0EXUpdatesConfig *)config
{
  // various places in the code assume that we have a nonnull runtimeVersion, so if the developer
  // hasn't configured either runtimeVersion or sdkVersion, we'll use a dummy value of "1" but warn
  // the developer in JS that they need to configure one of these values
  return config.runtimeVersion ?: config.sdkVersion ?: @"1";
}

@end

NS_ASSUME_NONNULL_END
