// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevice/EXDevice.h>
#import "DeviceUID.h"
#import <UMCore/UMUtilities.h>

#include <ifaddrs.h>
#include <arpa/inet.h>
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
#endif

@interface EXDevice() {
  WKWebView *webView;
}

@property (nonatomic, strong) NSString *webViewUserAgent;

@end

@implementation EXDevice

UM_EXPORT_MODULE(ExpoDevice);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(getUserAgentAsync,
                    getWebViewUserAgentWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  __weak EXDevice *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    __strong EXDevice *strongSelf = weakSelf;
    if (strongSelf) {
      if (!strongSelf.webViewUserAgent) {
        // We need to retain the webview because it runs an async task.
        strongSelf->webView = [[WKWebView alloc] init];
        
        [strongSelf->webView evaluateJavaScript:@"window.navigator.userAgent;" completionHandler:^(id _Nullable result, NSError * _Nullable error) {
          if (error) {
            reject(@"ERR_CONSTANTS", error.localizedDescription, error);
            return;
          }
          
          strongSelf.webViewUserAgent = [NSString stringWithFormat:@"%@", result];
          resolve(UMNullIfNil(strongSelf.webViewUserAgent));
          // Destroy the webview now that it's task is complete.
          strongSelf->webView = nil;
        }];
      } else {
        resolve(UMNullIfNil(strongSelf.webViewUserAgent));
      }
    }
  });
}

UM_EXPORT_METHOD_AS(getMACAddressAsync,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  //some iOS privacy issues
  NSString *address = @"02:00:00:00:00:00";
  resolve(address);
}

UM_EXPORT_METHOD_AS(getIPAddressAsync,
                    getIPAddressAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
  NSString *address = @"0.0.0.0";
  struct ifaddrs *interfaces = NULL;
  struct ifaddrs *temp_addr = NULL;
  int success = 0;
  // retrieve the current interfaces - returns 0 on success
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
  }
  // Free memory
  freeifaddrs(interfaces);
  resolve(address);
}

UM_EXPORT_METHOD_AS(isPinOrFingerprintSetAsync, isPinOrFingerprintSetAsyncWithResolver:(UMPromiseResolveBlock)resolve rejecter:(UMPromiseRejectBlock)reject)
{
#if TARGET_OS_TV
  BOOL isPinOrFingerprintSet = false;
#else
  LAContext *context = [[LAContext alloc] init];
  BOOL isPinOrFingerprintSet = ([context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:nil]);
#endif
  resolve(@[[NSNumber numberWithBool:isPinOrFingerprintSet]]);
}

UM_EXPORT_METHOD_AS(getFreeDiskStorageAsync, getFreeDiskStorageAsyncWithResolver:(UMPromiseResolveBlock)resolve rejector:(UMPromiseRejectBlock)reject)
{
  NSString *returnString = [NSString stringWithFormat:@"%llu", self.freeDiskStorage];
  resolve(returnString);
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
#if (TARGET_OS_TV)
  return nil;
#else
  CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
  CTCarrier *carrier = [netinfo subscriberCellularProvider];
  return carrier.carrierName;
#endif
}

/*device types*/
typedef NS_ENUM(NSInteger, DeviceType) {
  DeviceTypeHandset,
  DeviceTypeTablet,
  DeviceTypeTv,
  DeviceTypeUnknown
};

#define DeviceTypeValues [NSArray arrayWithObjects: @"Handset", @"Tablet", @"Tv", @"Unknown", nil]

- (DeviceType)getDeviceType
{
  switch ([[UIDevice currentDevice] userInterfaceIdiom]) {
    case UIUserInterfaceIdiomPhone: return DeviceTypeHandset;
    case UIUserInterfaceIdiomPad: return DeviceTypeTablet;
    case UIUserInterfaceIdiomTV: return DeviceTypeTv;
    default: return DeviceTypeUnknown;
  }
}

- (bool) isTablet
{
  return [self getDeviceType] == DeviceTypeTablet;
}

- (NSString *)getCPUType {
  /* https://stackoverflow.com/questions/19859388/how-can-i-get-the-ios-device-cpu-architecture-in-runtime */
  const NXArchInfo *info = NXGetLocalArchInfo();
  NSString *typeOfCpu = [NSString stringWithUTF8String:info->description];
  return typeOfCpu;
}


- (unsigned long long) totalMemory {
  return [NSProcessInfo processInfo].physicalMemory;
}

- (NSDictionary *) getStorageDictionary {
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  return [[NSFileManager defaultManager] attributesOfFileSystemForPath:[paths lastObject] error: nil];
}

- (uint64_t) totalDiskCapacity {
  uint64_t totalSpace = 0;
  NSDictionary *storage = [self getStorageDictionary];
  
  if (storage) {
    NSNumber *fileSystemSizeInBytes = [storage objectForKey: NSFileSystemSize];
    totalSpace = [fileSystemSizeInBytes unsignedLongLongValue];
  }
  return totalSpace;
}

- (uint64_t) freeDiskStorage {
  uint64_t freeSpace = 0;
  NSDictionary *storage = [self getStorageDictionary];
  
  if (storage) {
    NSNumber *freeFileSystemSizeInBytes = [storage objectForKey: NSFileSystemFreeSize];
    freeSpace = [freeFileSystemSizeInBytes unsignedLongLongValue];
  }
  return freeSpace;
}


- (NSDictionary *)constantsToExport
{
  UIDevice *currentDevice = [UIDevice currentDevice];
  NSString *uniqueId = [DeviceUID uid]; //TODO: need to import this
  
  return @{
           @"brand": @"Apple",
           @"carrier": self.carrier ?: [NSNull null],
           @"deviceType": [DeviceTypeValues objectAtIndex: [self getDeviceType]] ?: [NSNull null],
           @"deviceName": currentDevice.name, //TODO, ADD TO JS AS WELL
           @"deviceId": self.deviceId ?: [NSNull null],
           //           @"freeDiskStorage": @(self.freeDiskStorage),
           //           @"isEmulator": @NO,
           @"isTablet": @(self.isTablet),
           @"manufacturer": @"Apple",
           //           @"model": self.deviceId, // DON'T WORRY ABOUT FOR NOW
           //           @"phoneNumber": @"undefined3", // ANDROID ONLY
           //           @"serialNumber": @"undefined4", // ANDROID ONLY
           @"supportedABIs": @[[self getCPUType]],
           @"systemName": currentDevice.systemName,
           @"totalMemory": @(self.totalMemory),
           @"totalDiskCapacity": @(self.totalDiskCapacity),
           @"uniqueId": uniqueId,
           };
}

@end

