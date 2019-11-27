// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevice/EXDevice.h>

#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>
#import <mach-o/arch.h>
#import <sys/utsname.h>

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#if !(TARGET_OS_TV)
@import Darwin.sys.sysctl;
#endif

NS_ASSUME_NONNULL_BEGIN

@interface EXDevice()

@end

@implementation EXDevice

UM_EXPORT_MODULE(ExpoDevice);

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
           @"modelId": UMNullIfNil([[self class] modelId]),
           @"deviceYearClass": [[self class] deviceYear],
           @"totalMemory": @(NSProcessInfo.processInfo.physicalMemory),
           @"supportedCpuArchitectures": UMNullIfNil([[self class] cpuArchitectures]),
           @"osName": currentDevice.systemName,
           @"osVersion": currentDevice.systemVersion,
           @"osBuildId": osBuildId,
           @"osInternalBuildId": osBuildId,
           @"deviceName": currentDevice.name,
           };
}

UM_EXPORT_METHOD_AS(getDeviceTypeAsync,
                    getDeviceTypeAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  resolve(@([[self class] deviceType]));
}

UM_EXPORT_METHOD_AS(getUptimeAsync,
                    getUptimeAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  double uptimeMs = NSProcessInfo.processInfo.systemUptime * 1000;
  resolve(@(uptimeMs));
}

UM_EXPORT_METHOD_AS(isRootedExperimentalAsync,
                    isRootedExperimentalAsyncWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
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

  if ([modelId isEqualToString:@"i386"] || [modelId isEqualToString:@"x86_64"] ) {
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

+ (NSNumber *)deviceYear
{
  NSString *platform = [self devicePlatform];
  
  // TODO: Apple TV and Apple watch
  NSDictionary *mapping = @{
    // iPhone 1
    @"iPhone1,1": @2007,
    
    // iPhone 3G
    @"iPhone1,2": @2008,
    
    // iPhone 3GS
    @"iPhone2,1": @2009,
    
    // iPhone 4
    @"iPhone3,1": @2010,
    @"iPhone3,2": @2010,
    @"iPhone3,3": @2010,
    
    // iPhone 4S
    @"iPhone4,1": @2011,
    
    // iPhone 5
    @"iPhone5,1": @2012,
    @"iPhone5,2": @2012,
    
    // iPhone 5S and 5C
    @"iPhone5,3": @2013,
    @"iPhone5,4": @2013,
    @"iPhone6,1": @2013,
    @"iPhone6,2": @2013,
    
    @"iPhone7,1": @2014, // iPhone 6 Plus
    @"iPhone7,2": @2014, // iPhone 6
    @"iPhone8,1": @2015, // iPhone 6S
    @"iPhone8,2": @2015, // iPhone 6S Plus
    @"iPhone8,4": @2016, // iPhone SE
    @"iPhone9,1": @2016, // iPhone 7
    @"iPhone9,3": @2016, // iPhone 7 Plus
    @"iPhone9,2": @2016, // iPhone 7
    @"iPhone9,4": @2016, // iPhone 7 Plus
    @"iPhone10,1": @2017, // iPhone 8
    @"iPhone10,2": @2017, // iPhone 8 Plus
    @"iPhone10,3": @2017, // iPhone X Global
    @"iPhone10,4": @2017, // iPhone 8
    @"iPhone10,5": @2017, // iPhone 8 Plus
    @"iPhone10,6": @2017, // iPhone X GSM
    @"iPhone11,2": @2018, // iPhone Xs
    @"iPhone11,4": @2018, // iPhone Xs Max
    @"iPhone11,6": @2018, // iPhone Xs Max Global
    @"iPhone11,8": @2018, // iPhone Xr
    @"iPhone12,1": @2019, // iPhone 11
    @"iPhone12,3": @2019, // iPhone 11 Pro
    @"iPhone12,5": @2019, // iPhone 11 Pro Max
    
    // iPod
    @"iPod1,1": @2007,
    @"iPod2,1": @2008,
    @"iPod3,1": @2009,
    @"iPod4,1": @2010,
    @"iPod5,1": @2012,
    @"iPod7,1": @2015, // iPod 6th Gen
    @"iPod9,1": @2019, // iPod 7th Gen
    
    // iPad
    @"iPad1,1": @2010,
    @"iPad2,1": @2011,
    @"iPad2,2": @2011,
    @"iPad2,3": @2011,
    @"iPad2,4": @2011,
    @"iPad2,5": @2012, // iPad Mini (WiFi)
    @"iPad2,6": @2012, // iPad Mini (GSM+LTE)
    @"iPad2,7": @2012, // iPad Mini (CDMA+LTE)
    @"iPad3,1": @2012,
    @"iPad3,2": @2012,
    @"iPad3,3": @2012,
    @"iPad3,4": @2013,
    @"iPad3,5": @2013,
    @"iPad3,6": @2013,
    @"iPad4,1": @2013,
    @"iPad4,2": @2013,
    @"iPad4,3": @2013,
    @"iPad4,4": @2013, // iPad Mini Retina (WiFi)
    @"iPad4,5": @2013, // iPad Mini Retina (GSM+CDMA)
    @"iPad4,6": @2013, // iPad Mini Retina (China)
    @"iPad4,7": @2014, // iPad Mini 3 (WiFi)
    @"iPad4,8": @2014, // iPad Mini 3 (GSM+CDMA)
    @"iPad4,9": @2014, // iPad Mini 3 (China)
    @"iPad5,1": @2015, // iPad Mini 4 (WiFi)
    @"iPad5,2": @2015, // iPad Mini 4 (WiFi+Cellular)
    @"iPad5,3": @2014,
    @"iPad5,4": @2014,
    @"iPad6,7": @2015,
    @"iPad6,8": @2015,
    @"iPad6,3": @2016,
    @"iPad6,4": @2016,
    @"iPad6,11": @2017, // iPad 5th Gen (WiFi)
    @"iPad6,12": @2017, // iPad 5th Gen (WiFi+Cellular)
    @"iPad7,1": @2017,  // iPad Pro 2nd Gen (WiFi)
    @"iPad7,2": @2017,  // iPad Pro 2nd Gen (WiFi+Cellular)
    @"iPad7,3": @2017,  // iPad Pro 10.5-inch
    @"iPad7,4": @2017,  // iPad Pro 10.5-inch
    @"iPad7,5": @2018,  // iPad 6th Gen (WiFi)
    @"iPad7,6": @2018,  // iPad 6th Gen (WiFi+Cellular)
    @"iPad7,11": @2019, // iPad 7th Gen 10.2-inch (WiFi)
    @"iPad7,12": @2019, // iPad 7th Gen 10.2-inch (WiFi+Cellular)
    @"iPad8,1": @2018,  // iPad Pro 3rd Gen (11 inch, WiFi)
    @"iPad8,2": @2018,  // iPad Pro 3rd Gen (11 inch, 1TB, WiFi)
    @"iPad8,3": @2018,  // iPad Pro 3rd Gen (11 inch, WiFi+Cellular)
    @"iPad8,4": @2018,  // iPad Pro 3rd Gen (11 inch, 1TB, WiFi+Cellular)
    @"iPad8,5": @2018,  // iPad Pro 3rd Gen (12.9 inch, WiFi)
    @"iPad8,6": @2018,  // iPad Pro 3rd Gen (12.9 inch, 1TB, WiFi)
    @"iPad8,7": @2018,  // iPad Pro 3rd Gen (12.9 inch, WiFi+Cellular)
    @"iPad8,8": @2018,  // iPad Pro 3rd Gen (12.9 inch, 1TB, WiFi+Cellular)
    @"iPad11,1": @2019, // iPad Mini 5th Gen (WiFi)
    @"iPad11,2": @2019, // iPad Mini 5th Gen
    @"iPad11,3": @2019, // iPad Air 3rd Gen (WiFi)
    @"iPad11,4": @2019, // iPad Air 3rd Gen
  };
  
  NSNumber *deviceYear = mapping[platform];
  
  if (deviceYear) {
    return deviceYear;
  }
  
  // Simulator or unknown - assume this is the newest device
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy"];
  NSString *yearString = [formatter stringFromDate:[NSDate date]];
  
  return @([yearString intValue]);
}

+ (NSString *)devicePlatform
{
  // https://gist.github.com/Jaybles/1323251
  // https://www.theiphonewiki.com/wiki/Models
  size_t size;
  sysctlbyname("hw.machine", NULL, &size, NULL, 0);
  char *machine = malloc(size);
  sysctlbyname("hw.machine", machine, &size, NULL, 0);
  NSString *platform = [NSString stringWithUTF8String:machine];
  free(machine);
  return platform;
}

@end

NS_ASSUME_NONNULL_END
