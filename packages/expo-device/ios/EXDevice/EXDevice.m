// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevice/EXDevice.h>

#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>
#import <mach-o/arch.h>
#import <sys/utsname.h>

#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXUtilities.h>

#if !(TARGET_OS_TV)
@import Darwin.sys.sysctl;
#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXDevice()

@end

@implementation EXDevice

EX_EXPORT_MODULE(ExpoDevice);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (NSDictionary *)constantsToExport
{
  UIDevice *currentDevice = UIDevice.currentDevice;
  NSString * _Nullable osBuildId = [[self class] osBuildId];

  return @{
           @"isDevice": @([[self class] isDevice]),
           @"brand": @"Apple",
           @"manufacturer": @"Apple",
           @"modelId": EXNullIfNil([[self class] modelId]),
           @"modelName": [[self class] modelName],
           @"deviceYearClass": [[self class] deviceYear],
           @"totalMemory": @(NSProcessInfo.processInfo.physicalMemory),
           @"supportedCpuArchitectures": EXNullIfNil([[self class] cpuArchitectures]),
           @"osName": currentDevice.systemName,
           @"osVersion": currentDevice.systemVersion,
           @"osBuildId": osBuildId,
           @"osInternalBuildId": osBuildId,
           @"deviceName": currentDevice.name,
           };
}

EX_EXPORT_METHOD_AS(getDeviceTypeAsync,
                    getDeviceTypeAsyncWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([[self class] deviceType]));
}

EX_EXPORT_METHOD_AS(getUptimeAsync,
                    getUptimeAsyncWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  double uptimeMs = NSProcessInfo.processInfo.systemUptime * 1000;
  resolve(@(uptimeMs));
}

EX_EXPORT_METHOD_AS(isRootedExperimentalAsync,
                    isRootedExperimentalAsyncWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  resolve(@([[self class] isRooted]));
}

+ (BOOL)isRooted
{
#if !(TARGET_IPHONE_SIMULATOR)
  NSFileManager *fileManager = [NSFileManager defaultManager];
  if ([fileManager fileExistsAtPath:@"/Applications/Cydia.app"] ||
      [fileManager fileExistsAtPath:@"/Library/MobileSubstrate/MobileSubstrate.dylib"] ||
      [fileManager fileExistsAtPath:@"/bin/bash"] ||
      [fileManager fileExistsAtPath:@"/usr/sbin/sshd"] ||
      [fileManager fileExistsAtPath:@"/etc/apt"] ||
      [fileManager fileExistsAtPath:@"/usr/bin/ssh"] ||
      [fileManager fileExistsAtPath:@"/private/var/lib/apt/"]) {
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
  if ([UIApplication.sharedApplication canOpenURL:[NSURL URLWithString:@"cydia://package/com.example.package"]]) {
    return YES;
  }
#endif
  return NO;
}

+ (NSString *)modelId
{
  struct utsname systemInfo;

  uname(&systemInfo);

  NSString *modelId = [NSString stringWithCString:systemInfo.machine
                                         encoding:NSUTF8StringEncoding];

  if ([modelId isEqualToString:@"i386"] || [modelId isEqualToString:@"x86_64"] || [modelId isEqualToString:@"arm64"]) {
    modelId = [NSString stringWithFormat:@"%s", getenv("SIMULATOR_MODEL_IDENTIFIER")];
  }

  return modelId;
}

+ (EXDeviceType)deviceType
{
  switch (UIDevice.currentDevice.userInterfaceIdiom) {
    case UIUserInterfaceIdiomPhone:
      return EXDeviceTypePhone;
    case UIUserInterfaceIdiomPad:
      return EXDeviceTypeTablet;
    case UIUserInterfaceIdiomTV:
      return EXDeviceTypeTV;
    default:
      // NOTE: in the future for macOS, return Desktop
      return EXDeviceTypeUnknown;
  }
}

+ (nullable NSArray<NSString *> *)cpuArchitectures
{
  // NXGetLocalArchInfo() returns the NXArchInfo for the local host, or NULL if none is known
  // https://stackoverflow.com/questions/19859388/how-can-i-get-the-ios-device-cpu-architecture-in-runtime
  const NXArchInfo *info = NXGetLocalArchInfo(); 
  if (!info) {
    return nil;
  }
  NSString *cpuType = [NSString stringWithUTF8String:info->description];
  return @[cpuType];
}

+ (BOOL)isDevice
{
#if TARGET_IPHONE_SIMULATOR
  return NO;
#else
  return YES;
#endif
}

+ (nullable NSString *)osBuildId
{
#if TARGET_OS_TV
  return nil;
#else
  size_t bufferSize = 64;
  NSMutableData *buffer = [[NSMutableData alloc] initWithLength:bufferSize];
  int status = sysctlbyname("kern.osversion", buffer.mutableBytes, &bufferSize, NULL, 0);
  if (status != 0) {
    return nil;
  }
  return [[NSString alloc] initWithCString:buffer.mutableBytes encoding:NSUTF8StringEncoding];
#endif
}

+ (NSDictionary *)getDeviceMap
{
  return @{
    // iPod
    // -- 12 Start --
    @"iPod7,1": @{ @"name": @"iPod Touch (6th generation)", @"year": @2015 }, // (Sixth Generation)
    // -- 12 End --
    @"iPod9,1": @{ @"name": @"iPod Touch (7th generation)", @"year": @2019 }, // (Seventh Generation)

    // iPhone
    // -- 12 Start --
    @"iPhone6,1": @{ @"name": @"iPhone 5s", @"year": @2013 }, // (model A1433, A1533 | GSM)
    @"iPhone6,2": @{ @"name": @"iPhone 5s", @"year": @2013 }, // (model A1457, A1518, A1528 (China), A1530 | Global)
    @"iPhone7,1": @{ @"name": @"iPhone 6 Plus", @"year": @2014 }, //
    @"iPhone7,2": @{ @"name": @"iPhone 6", @"year": @2014 }, //
    // -- 12 End --
    @"iPhone8,1": @{ @"name": @"iPhone 6s", @"year": @2015 }, //
    @"iPhone8,2": @{ @"name": @"iPhone 6s Plus", @"year": @2015 }, //
    @"iPhone8,4": @{ @"name": @"iPhone SE", @"year": @2016 }, //
    @"iPhone9,1": @{ @"name": @"iPhone 7", @"year": @2016 }, // (model A1660 | CDMA)
    @"iPhone9,3": @{ @"name": @"iPhone 7", @"year": @2016 }, // (model A1778 | Global)
    @"iPhone9,2": @{ @"name": @"iPhone 7 Plus", @"year": @2016 }, // (model A1661 | CDMA)
    @"iPhone9,4": @{ @"name": @"iPhone 7 Plus", @"year": @2016 }, // (model A1784 | Global)
    @"iPhone10,1": @{ @"name": @"iPhone 8", @"year": @2017 }, // (model A1863, A1906, A1907)
    @"iPhone10,2": @{ @"name": @"iPhone 8 Plus", @"year": @2017 }, // (model A1864, A1898, A1899)
    @"iPhone10,3": @{ @"name": @"iPhone X", @"year": @2017 }, // (model A1865, A1902)
    @"iPhone10,4": @{ @"name": @"iPhone 8", @"year": @2017 }, // (model A1905)
    @"iPhone10,5": @{ @"name": @"iPhone 8 Plus", @"year": @2017 }, // (model A1897)
    @"iPhone10,6": @{ @"name": @"iPhone X", @"year": @2017 }, // (model A1901)
    @"iPhone11,2": @{ @"name": @"iPhone XS", @"year": @2018 }, // (model A2097, A2098)
    @"iPhone11,4": @{ @"name": @"iPhone XS Max", @"year": @2018 }, // (model A1921, A2103)
    @"iPhone11,6": @{ @"name": @"iPhone XS Max", @"year": @2018 }, // (model A2104)
    @"iPhone11,8": @{ @"name": @"iPhone XR", @"year": @2018 }, // (model A1882, A1719, A2105)
    @"iPhone12,1": @{ @"name": @"iPhone 11", @"year": @2019 },
    @"iPhone12,3": @{ @"name": @"iPhone 11 Pro", @"year": @2019 },
    @"iPhone12,5": @{ @"name": @"iPhone 11 Pro Max", @"year": @2019 },
    @"iPhone12,8": @{ @"name": @"iPhone SE 2", @"year": @2020 },
    @"iPhone13,1": @{ @"name": @"iPhone 12 mini", @"year": @2020 },
    @"iPhone13,2": @{ @"name": @"iPhone 12", @"year": @2020 },
    @"iPhone13,3": @{ @"name": @"iPhone 12 Pro", @"year": @2020 },
    @"iPhone13,4": @{ @"name": @"iPhone 12 Pro Max", @"year": @2020 },
    @"iPhone14,2": @{ @"name": @"iPhone 13 Pro", @"year": @2021 },
    @"iPhone14,3": @{ @"name": @"iPhone 13 Pro Max", @"year": @2021 },
    @"iPhone14,4": @{ @"name": @"iPhone 13 Mini", @"year": @2021 },
    @"iPhone14,5": @{ @"name": @"iPhone 13", @"year": @2021 },

    // -- 12 Start --
    @"iPad4,1": @{ @"name": @"iPad Air (5th generation)", @"year": @2017 }, // Wifi
    @"iPad4,2": @{ @"name": @"iPad Air (5th generation)", @"year": @2017 }, // Cellular
    @"iPad4,3": @{ @"name": @"iPad Air (5th generation)", @"year": @2017 },
    @"iPad4,4": @{ @"name": @"iPad mini (2nd generation)", @"year": @2013 }, // Wifi
    @"iPad4,5": @{ @"name": @"iPad mini (2nd generation)", @"year": @2013 }, // Cellular
    @"iPad4,6": @{ @"name": @"iPad mini (2nd generation)", @"year": @2013 }, // China
    @"iPad4,7": @{ @"name": @"iPad mini (3rd generation)", @"year": @2014 }, 
    @"iPad4,8": @{ @"name": @"iPad mini (3rd generation)", @"year": @2014 },
    @"iPad4,9": @{ @"name": @"iPad mini (3rd generation)", @"year": @2014 }, // China
    // -- 12 End --
    @"iPad5,1": @{ @"name": @"iPad mini (4th generation)", @"year": @2015 },
    @"iPad5,2": @{ @"name": @"iPad mini (4th generation)", @"year": @2015 },
    @"iPad5,3": @{ @"name": @"iPad Air 2 (6th generation)", @"year": @2014 },
    @"iPad5,4": @{ @"name": @"iPad Air 2 (6th generation)", @"year": @2014 },
    @"iPad6,3": @{ @"name": @"iPad Pro 9.7-inch", @"year": @2016 }, 
    @"iPad6,4": @{ @"name": @"iPad Pro 9.7-inch", @"year": @2016 }, 
    @"iPad6,7": @{ @"name": @"iPad Pro 12.9-inch", @"year": @2015 }, 
    @"iPad6,8": @{ @"name": @"iPad Pro 12.9-inch", @"year": @2015 }, 
    @"iPad7,1": @{ @"name": @"iPad Pro 12.9-inch (2nd generation)", @"year": @2017 }, // Wifi
    @"iPad7,2": @{ @"name": @"iPad Pro 12.9-inch (2nd generation)", @"year": @2017 }, // Cellular
    @"iPad7,3": @{ @"name": @"iPad Pro 10.5-inch", @"year": @2017 }, // Wifi
    @"iPad7,4": @{ @"name": @"iPad Pro 10.5-inch", @"year": @2017 }, // Cellular
    @"iPad7,5": @{ @"name": @"iPad (6th generation)", @"year": @2018 }, // Wifi
    @"iPad7,6": @{ @"name": @"iPad (6th generation)", @"year": @2018 }, // Cellular
    @"iPad7,11": @{ @"name": @"iPad (7th generation)", @"year": @2019 }, // WiFi
    @"iPad7,12": @{ @"name": @"iPad (7th generation)", @"year": @2019 }, // WiFi + cellular
    @"iPad8,1": @{ @"name": @"iPad Pro 11-inch (3rd generation)", @"year": @2018 }, // Wifi
    @"iPad8,2": @{ @"name": @"iPad Pro 11-inch (3rd generation)", @"year": @2018 }, // 1TB - Wifi
    @"iPad8,3": @{ @"name": @"iPad Pro 11-inch (3rd generation)", @"year": @2018 }, // Wifi + cellular
    @"iPad8,4": @{ @"name": @"iPad Pro 11-inch (3rd generation)", @"year": @2018 }, // 1TB - Wifi + cellular
    @"iPad8,5": @{ @"name": @"iPad Pro 12.9-inch (3rd generation)", @"year": @2018 }, // Wifi
    @"iPad8,6": @{ @"name": @"iPad Pro 12.9-inch (3rd generation)", @"year": @2018 }, // 1TB - Wifi
    @"iPad8,7": @{ @"name": @"iPad Pro 12.9-inch (3rd generation)", @"year": @2018 }, // Wifi + cellular
    @"iPad8,8": @{ @"name": @"iPad Pro 12.9-inch (3rd generation)", @"year": @2018 }, // 1TB - Wifi + cellular

    @"iPad8,9": @{ @"name": @"iPad Pro 11-inch (4th generation)", @"year": @2020 }, // Wifi
    @"iPad8,10": @{ @"name": @"iPad Pro 11-inch (4th generation)", @"year": @2020 }, // Wifi + cellular
    @"iPad8,11": @{ @"name": @"iPad Pro 12.9-inch (4th generation)", @"year": @2020 }, // Wifi
    @"iPad8,12": @{ @"name": @"iPad Pro 12.9-inch (4th generation)", @"year": @2020 }, // Wifi + cellular
    @"iPad11,1": @{ @"name": @"iPad mini (5th generation)", @"year": @2019 }, // WiFi
    @"iPad11,2": @{ @"name": @"iPad mini (5th generation)", @"year": @2019 }, // WiFi + cellular
    @"iPad11,3": @{ @"name": @"iPad Air (3rd generation)", @"year": @2019 }, // WiFi
    @"iPad11,4": @{ @"name": @"iPad Air (3rd generation)", @"year": @2019 }, // WiFi + cellular
    @"iPad11,6": @{ @"name": @"iPad (8th generation)", @"year": @2020 }, // WiFi
    @"iPad11,7": @{ @"name": @"iPad (8th generation)", @"year": @2020 }, // WiFi + cellular
    @"iPad13,1": @{ @"name": @"iPad Air (4th generation)", @"year": @2020 }, // WiFi
    @"iPad13,2": @{ @"name": @"iPad Air (4th generation)", @"year": @2020 }, // WiFi + cellular
    @"iPad13,4": @{ @"name": @"iPad Pro 11-inch 3", @"year": @2021 }, // WiFi
    @"iPad13,5": @{ @"name": @"iPad Pro 11-inch 3", @"year": @2021 }, // WiFi
    @"iPad13,6": @{ @"name": @"iPad Pro 11-inch 3", @"year": @2021 }, // WiFi + cellular
    @"iPad13,7": @{ @"name": @"iPad Pro 11-inch 3", @"year": @2021 }, // WiFi + cellular
    @"iPad13,8": @{ @"name": @"iPad Pro 12.9-inch 5", @"year": @2021 }, // WiFi
    @"iPad13,9": @{ @"name": @"iPad Pro 12.9-inch 5", @"year": @2021 }, // WiFi
    @"iPad13,10": @{ @"name": @"iPad Pro 12.9-inch 5", @"year": @2021 }, // WiFi + cellular
    @"iPad13,11": @{ @"name": @"iPad Pro 12.9-inch 5", @"year": @2021 }, // WiFi + cellular
    @"iPad14,1": @{ @"name": @"iPad mini 6", @"year": @2021 }, // WiFi
    @"iPad14,2": @{ @"name": @"iPad mini 6", @"year": @2021 }, // WiFi + cellular

    @"AppleTV2,1": @{ @"name": @"Apple TV (2nd generation)", @"year": @2010 }, 
    @"AppleTV3,1": @{ @"name": @"Apple TV (3rd generation)", @"year": @2012 },
    @"AppleTV3,2": @{ @"name": @"Apple TV (3rd generation - Rev A)", @"year": @2013 },
    @"AppleTV5,3": @{ @"name": @"Apple TV (4th generation)", @"year": @2015 },
    @"AppleTV6,2": @{ @"name": @"Apple TV 4K", @"year": @2021 }
  };
}

+ (nullable NSString *)modelName
{
  NSString *platform = [self modelId];
  
  if (platform == nil) {
    return [NSNull null];
  }
  
  NSDictionary *mapping = [self getDeviceMap];
    
  if (mapping[platform]) {
    return mapping[platform][@"name"];
  }

  // Infer the main type of model from the ID
  if ([platform hasPrefix:@"iPod"]) {
    return @"iPod Touch";
  }

  if ([platform hasPrefix:@"iPad"]) {
    return @"iPad";
  }

  if ([platform hasPrefix:@"iPhone"]) {
    return @"iPhone";
  }

  if ([platform hasPrefix:@"AppleTV"]) {
    return @"Apple TV";
  }

  return [NSNull null];
}

+ (NSNumber *)deviceYear
{
  NSString *platform = [self modelId];
  
  if (platform != nil) {
    NSDictionary *mapping = [self getDeviceMap];
    
    if (mapping[platform]) {
      return mapping[platform][@"year"];
    }
  }
  
  // Simulator or unknown - assume this is the newest device
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy"];
  NSString *yearString = [formatter stringFromDate:[NSDate date]];
  
  return @([yearString intValue]);
}

@end

NS_ASSUME_NONNULL_END
