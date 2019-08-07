// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevice/EXDevice.h>
#import <UMCore/UMUtilities.h>

#import <mach-o/arch.h>
#import <CoreLocation/CoreLocation.h>
#import <UIKit/UIKit.h>
#import <sys/utsname.h>

#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMUtilities.h>

#if !(TARGET_OS_TV)
@import Darwin.sys.sysctl;
#endif

@interface EXDevice()

@end

@implementation EXDevice

UM_EXPORT_MODULE(ExpoDevice);

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
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

- (NSString *)deviceType
{
  switch ([[UIDevice currentDevice] userInterfaceIdiom]) {
    case UIUserInterfaceIdiomPhone: return @"PHONE";
    case UIUserInterfaceIdiomPad: return @"TABLET";
    case UIUserInterfaceIdiomTV: return @"TV";
    default: return @"UNKNOWN";
  }
}

- (nullable NSArray<NSString *> *)cpuType {
  /* https://stackoverflow.com/questions/19859388/how-can-i-get-the-ios-device-cpu-architecture-in-runtime */
  const NXArchInfo *info = NXGetLocalArchInfo(); // NXGetLocalArchInfo() returns the NXArchInfo for the local host, or NULL if none is known
  if (!info) {
    return nil;
  }
  NSString *typeOfCpu = [NSString stringWithUTF8String:info->description];
  return @[typeOfCpu];
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
  
  // TODO: apple TV and apple watch
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
                            
                            // iPhone 6 and 6 Plus
                            @"iPhone7,1": @2014,
                            @"iPhone7,2": @2014,
                            
                            // iPhone 6S and 6S Plus
                            @"iPhone8,1": @2015,
                            @"iPhone8,2": @2015,
                            
                            // iPhone SE
                            @"iPhone8,4": @2016,
                            
                            // iPhone 7 and 7 Plus
                            @"iPhone9,1": @2016,
                            @"iPhone9,3": @2016,
                            @"iPhone9,2": @2016,
                            @"iPhone9,4": @2016,
                            
                            // iPhone 8, 8 Plus, X
                            @"iPhone10,1": @2017,
                            @"iPhone10,2": @2017,
                            @"iPhone10,3": @2017,
                            @"iPhone10,4": @2017,
                            @"iPhone10,5": @2017,
                            @"iPhone10,6": @2017,
                            
                            // iPhone Xs, Xs Max, Xr
                            @"iPhone11,2": @2018,
                            @"iPhone11,4": @2018,
                            @"iPhone11,6": @2018,
                            @"iPhone11,8": @2018,
                            
                            // iPod
                            @"iPod1,1": @2007,
                            @"iPod2,1": @2008,
                            @"iPod3,1": @2009,
                            @"iPod4,1": @2010,
                            @"iPod5,1": @2012,
                            @"iPod7,1": @2015,
                            
                            // iPad
                            @"iPad1,1": @2010,
                            @"iPad2,1": @2011,
                            @"iPad2,2": @2011,
                            @"iPad2,3": @2011,
                            @"iPad2,4": @2011,
                            @"iPad3,1": @2012,
                            @"iPad3,2": @2012,
                            @"iPad3,3": @2012,
                            @"iPad3,4": @2013,
                            @"iPad3,5": @2013,
                            @"iPad3,6": @2013,
                            @"iPad4,1": @2013,
                            @"iPad4,2": @2013,
                            @"iPad4,3": @2013,
                            @"iPad5,3": @2014,
                            @"iPad5,4": @2014,
                            @"iPad6,7": @2015,
                            @"iPad6,8": @2015,
                            @"iPad6,3": @2016,
                            @"iPad6,4": @2016,
                            @"iPad6,11": @2017,
                            @"iPad6,12": @2017,
                            @"iPad7,1": @2017,
                            @"iPad7,2": @2017,
                            @"iPad7,3": @2017,
                            @"iPad7,4": @2017,
                            @"iPad7,5": @2018,
                            @"iPad7,6": @2018,
                            
                            // iPad Mini
                            @"iPad2,5": @2012,
                            @"iPad2,6": @2012,
                            @"iPad2,7": @2012,
                            @"iPad4,4": @2013,
                            @"iPad4,5": @2013,
                            @"iPad4,6": @2013,
                            @"iPad4,7": @2014,
                            @"iPad4,8": @2014,
                            @"iPad4,9": @2014,
                            @"iPad5,1": @2015,
                            @"iPad5,2": @2015,
                            };
  
  NSNumber *deviceYear = mapping[platform];
  
  if (deviceYear) {
    return deviceYear;
  }
  
  // Simulator or unknown - just assume newest device.
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


- (NSDictionary *)constantsToExport
{
  UIDevice *currentDevice = [UIDevice currentDevice];
  
  return @{
           @"brand": @"Apple",
           @"deviceName": currentDevice.name,
           @"modelId": UMNullIfNil([self deviceId]),
           @"isDevice": @([self isDevice]),
           @"manufacturer": @"Apple",
           @"supportedCpuArchitectures": UMNullIfNil([self cpuType]),
           @"osName": currentDevice.systemName,
           @"totalMemory": [self totalMemory] ?: @(0),
           @"osVersion": currentDevice.systemVersion,
           @"osBuildId": [self osBuildId],
           @"osInternalBuildId": [self osBuildId],
           @"deviceYearClass": [[self class] deviceYear],
           };
}

@end
