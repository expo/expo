// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevice/EXDevice.h>
#import <EXDevice/EXDeviceUID.h>
#import <UMCore/UMUtilities.h>

#import <ifaddrs.h>
#import <arpa/inet.h>
#import <mach-o/arch.h>
#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>
#import <sys/utsname.h>

#import <CoreTelephony/CTCallCenter.h>
#import <CoreTelephony/CTCall.h>
#import <CoreTelephony/CTCarrier.h>
#import <CoreTelephony/CTTelephonyNetworkInfo.h>

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#import <WebKit/WKWebView.h>

#if !(TARGET_OS_TV)
#import <LocalAuthentication/LocalAuthentication.h>
@import Darwin.sys.sysctl;
#endif

@interface EXDevice() {
}

@property (nonatomic, strong) NSString *webViewUserAgent;
@property (nonatomic) bool isEmulator;

@end

@implementation EXDevice

UM_EXPORT_MODULE(ExpoDevice);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}


UM_EXPORT_METHOD_AS(getUserAgentAsync,
                    getWebViewUserAgentWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __weak EXDevice *weakSelf = self;
  EXDevice *strongSelf = weakSelf;
  
  __block WKWebView *webView;
  
  if (!strongSelf.webViewUserAgent) {
    // We need to retain the webview because it runs an async task.
    webView = [[WKWebView alloc] init];
    
    [webView evaluateJavaScript:@"window.navigator.userAgent;" completionHandler:^(id _Nullable result, NSError * _Nullable error) {
      if (error) {
        reject(@"ERR_CONSTANTS", error.localizedDescription, error);
        
        // Destroy the webview now that its task is complete.
        webView = nil;
        return;
      }
      
      strongSelf.webViewUserAgent = [NSString stringWithFormat:@"%@", result];
      resolve(UMNullIfNil(strongSelf.webViewUserAgent));
      
      // Destroy the webview now that its task is complete.
      webView = nil;
    }];
  } else {
    resolve(UMNullIfNil(strongSelf.webViewUserAgent));
  }
}

UM_EXPORT_METHOD_AS(getCarrierAsync,
                    getCarrierAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(self.carrier ?: [NSNull null]);
}

UM_EXPORT_METHOD_AS(getMACAddressAsync,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  //some iOS privacy issues
  NSString *address = @"02:00:00:00:00:00";
  resolve(address);
}

UM_EXPORT_METHOD_AS(getIpAddressAsync,
                    getIpAddressAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSString *address = @"0.0.0.0";
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *temp_addr = NULL;
  int success = 0;
  // retrieve the current interfaces - On success, returns 0; on error, -1 is returned, and errno is set appropriately.
  success = getifaddrs(&interfaces);
  
  if (success == 0) {
    // Loop through linked list of interfaces
    temp_addr = interfaces;
    while(temp_addr != NULL) {
      if(temp_addr->ifa_addr->sa_family == AF_INET) {
        // Check if interface is en0 which is the wifi connection on the iPhone
        if([[NSString stringWithUTF8String:temp_addr->ifa_name] isEqualToString:@"en0"]) {
          // Get NSString from C String
          address = [NSString stringWithUTF8String:inet_ntoa(((struct sockaddr_in *)temp_addr->ifa_addr)->sin_addr)];
        }
      }
      temp_addr = temp_addr->ifa_next;
    }
    resolve(address);
  } else {
    reject(@"E_NO_IFADDRS", @"No network interfaces could be retrieved.", nil);
  }
  
  // Free memory
  freeifaddrs(interfaces);
}

UM_EXPORT_METHOD_AS(hasLocalAuthenticationAsync, hasLocalAuthenticationAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_OS_TV
  BOOL hasLocalAuthentication = NO;
#else
  LAContext *context = [[LAContext alloc] init];
  BOOL hasLocalAuthentication = ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:nil]);
#endif
  resolve(@(hasLocalAuthentication));
}

UM_EXPORT_METHOD_AS(getUptimeAsync, getUptimeAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve([self systemUptime]);
}

UM_EXPORT_METHOD_AS(isRootedExperimentalAsync, isRootedExperimentalAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@([self isRooted]));
}

UM_EXPORT_METHOD_AS(getDeviceTypeAsync, getDeviceTypeAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(UMNullIfNil([self deviceType]));
}

- (BOOL)isRooted
{
#if !(TARGET_IPHONE_SIMULATOR)
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:@"/Applications/Cydia.app"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/Library/MobileSubstrate/MobileSubstrate.dylib"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/bin/bash"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/usr/sbin/sshd"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/etc/apt"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/usr/bin/ssh"]) {
    return YES;
  } else if ([fileManager fileExistsAtPath:@"/private/var/lib/apt/"]) {
    return YES;
  }
  
  FILE *file = fopen("/Applications/Cydia.app", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  file = fopen("/Library/MobileSubstrate/MobileSubstrate.dylib", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  file = fopen("/bin/bash", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  file = fopen("/usr/sbin/sshd", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  file = fopen("/etc/apt", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  file = fopen("/usr/bin/ssh", "r");
  if (file) {
    fclose(file);
    return YES;
  }
  
  // Check if the app can access outside of its sandbox
  NSError *error = nil;
  NSString *string = @".";
  [string writeToFile:@"/private/jailbreak.txt" atomically:YES encoding:NSUTF8StringEncoding error:&error];
  if (!error) {
    [fileManager removeItemAtPath:@"/private/jailbreak.txt" error:nil];
    return YES;
  }
  
  // Check if the app can open a Cydia's URL scheme
  if ([[UIApplication sharedApplication] canOpenURL:[NSURL URLWithString:@"cydia://package/com.example.package"]]) {
    return YES;
  }
#endif
  return NO;
}

- (NSNumber *)systemUptime
{ // returns the systemUptime in milliseconds
  return [NSNumber numberWithDouble:[NSProcessInfo processInfo].systemUptime * 1000];
}

- (NSString *)deviceId
{
  struct utsname systemInfo;
  
  uname(&systemInfo);
  
  NSString* deviceId = [NSString stringWithCString:systemInfo.machine
                                          encoding:NSUTF8StringEncoding];
  
  if ([deviceId isEqualToString:@"i386"] || [deviceId isEqualToString:@"x86_64"] ) {
    deviceId = [NSString stringWithFormat:@"%s", getenv("SIMULATOR_MODEL_IDENTIFIER")];
  }
  
  return deviceId;
}

- (NSString *)carrier
{
  CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
  CTCarrier *carrier = [netinfo subscriberCellularProvider];
  return carrier.carrierName;
}


- (NSString *)deviceType
{
  switch ([[UIDevice currentDevice] userInterfaceIdiom]) {
    case UIUserInterfaceIdiomPhone: return @"Handset";
    case UIUserInterfaceIdiomPad: return @"Tablet";
    case UIUserInterfaceIdiomTV: return @"Tv";
    default: return @"Unknown";
  }
}

- (NSString *)getCPUType {
  /* https://stackoverflow.com/questions/19859388/how-can-i-get-the-ios-device-cpu-architecture-in-runtime */
  const NXArchInfo *info = NXGetLocalArchInfo();
  NSString *typeOfCpu = [NSString stringWithUTF8String:info->description];
  return typeOfCpu;
}


- (NSNumber *)totalMemory {
  return [NSNumber numberWithUnsignedLongLong:[NSProcessInfo processInfo].physicalMemory];
}

- (BOOL)isDevice
{
#if TARGET_IPHONE_SIMULATOR
  return NO;
#endif
  return YES;
}

- (NSString *)osBuildId {
#if TARGET_OS_TV
  return @"not available";
#else
  size_t bufferSize = 64;
  NSMutableData *buffer = [[NSMutableData alloc] initWithLength:bufferSize];
  int status = sysctlbyname("kern.osversion", buffer.mutableBytes, &bufferSize, NULL, 0);
  if (status != 0) {
    return @"not available";
  }
  return [[NSString alloc] initWithCString:buffer.mutableBytes encoding:NSUTF8StringEncoding];
#endif
}

- (NSDictionary *)constantsToExport
{
  UIDevice *currentDevice = [UIDevice currentDevice];
  NSString *uniqueId = [EXDeviceUID uid];
  
  return @{
           @"brand": @"Apple",
           @"deviceName": currentDevice.name,
           @"modelId": UMNullIfNil([self deviceId]),
           @"isDevice": @([self isDevice]),
           @"manufacturer": @"Apple",
           @"supportedCpuArchitectures": @[[self getCPUType]],
           @"osName": currentDevice.systemName,
           @"totalMemory": [self totalMemory] ?: @(0),
//           @"uniqueId": uniqueId,
           @"osVersion": currentDevice.systemVersion,
           @"osBuildId": [self osBuildId],
           @"osInternalBuildId": [self osBuildId]
           };
}

@end

