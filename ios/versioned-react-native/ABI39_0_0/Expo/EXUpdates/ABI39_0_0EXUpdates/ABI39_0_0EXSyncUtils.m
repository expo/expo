//  Copyright © 2019 650 Industries. All rights reserved.

#import <CommonCrypto/CommonDigest.h>

#import <ABI39_0_0EXUpdates/ABI39_0_0EXSyncUtils.h>
#import <SystemConfiguration/SystemConfiguration.h>
#import <arpa/inet.h>

NS_ASSUME_NONNULL_BEGIN

static NSString * const ABI39_0_0EXSyncEventName = @"Expo.nativeUpdatesEvent";
static NSString * const ABI39_0_0EXSyncUtilsErrorDomain = @"ABI39_0_0EXSyncUtils";

@implementation ABI39_0_0EXSyncUtils

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
      *error = [NSError errorWithDomain:ABI39_0_0EXSyncUtilsErrorDomain code:1005 userInfo:@{NSLocalizedDescriptionKey: @"Failed to create the Updates Directory; a file already exists with the required directory name"}];
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

+ (void)sendEventToBridge:(nullable ABI39_0_0RCTBridge *)bridge withType:(NSString *)eventType body:(NSDictionary *)body
{
  if (bridge) {
    NSMutableDictionary *mutableBody = [body mutableCopy];
    mutableBody[@"type"] = eventType;
    [bridge enqueueJSCall:@"ABI39_0_0RCTDeviceEventEmitter.emit" args:@[ABI39_0_0EXSyncEventName, mutableBody]];
  } else {
    NSLog(@"ABI39_0_0EXUpdates: Could not emit %@ event. Did you set the bridge property on the controller singleton?", eventType);
  }
}

+ (BOOL)shouldCheckForUpdateWithConfig:(ABI39_0_0EXSyncConfig *)config
{
  switch (config.checkOnLaunch) {
    case ABI39_0_0EXSyncCheckAutomaticallyConfigNever:
      return NO;
    case ABI39_0_0EXSyncCheckAutomaticallyConfigWifiOnly: {
      struct sockaddr_in zeroAddress;
      bzero(&zeroAddress, sizeof(zeroAddress));
      zeroAddress.sin_len = sizeof(zeroAddress);
      zeroAddress.sin_family = AF_INET;

      SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithAddress(kCFAllocatorDefault, (const struct sockaddr *) &zeroAddress);
      SCNetworkReachabilityFlags flags;
      SCNetworkReachabilityGetFlags(reachability, &flags);

      return (flags & kSCNetworkReachabilityFlagsIsWWAN) == 0;
    }
    case ABI39_0_0EXSyncCheckAutomaticallyConfigAlways:
    default:
      return YES;
  }
}

+ (NSString *)getRuntimeVersionWithConfig:(ABI39_0_0EXSyncConfig *)config
{
  return config.runtimeVersion ?: config.sdkVersion;
}

@end

NS_ASSUME_NONNULL_END
