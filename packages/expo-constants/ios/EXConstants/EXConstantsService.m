// Copyright 2015-present 650 Industries. All rights reserved.

#include <sys/types.h>
#include <sys/sysctl.h>
#include <sys/utsname.h>

#import <UMCore/UMUtilities.h>
#import <EXConstants/EXConstantsService.h>

static const NSString *kEXDeviceInstallUUIDKey = @"EXDeviceInstallUUIDKey";

@interface EXConstantsService ()

@property (nonatomic, strong) NSString *sessionId;

@end

@implementation EXConstantsService

UM_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(UMConstantsInterface)];
}

- (NSDictionary *)constants
{
  if (!_sessionId) {
    _sessionId = [[NSUUID UUID] UUIDString];
  }

  BOOL isDebugXCodeScheme = NO;
#if DEBUG
  isDebugXCodeScheme = YES;
#endif

  return @{
           @"sessionId": _sessionId,
           @"statusBarHeight": @([self statusBarHeight]),
           @"deviceYearClass": [[self class] deviceYear],
           @"deviceName": [[self class] deviceName],
           @"isDevice": @([self isDevice]),
           @"systemFonts": [self systemFontNames],
           @"debugMode": @(isDebugXCodeScheme),
           @"isHeadless": @(NO),
           @"nativeAppVersion": [self appVersion],
           @"nativeBuildVersion": [self buildVersion],
           @"installationId": [[self class] installationId],
           @"platform": @{
               @"ios": @{
                   @"buildNumber": [self buildVersion],
                   @"platform": [[self class] devicePlatform],
                   @"model": [[self class] deviceModel],
                   @"userInterfaceIdiom": [self userInterfaceIdiom],
                   @"systemVersion": [self iosVersion],
                   },
               },
           };
}

- (NSString *)appVersion
{
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleShortVersionString"];
}
                            
- (NSString *)buildVersion
{
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
}

- (CGFloat)statusBarHeight
{
  __block CGSize statusBarSize;
  [UMUtilities performSynchronouslyOnMainThread:^{
    statusBarSize = [UIApplication sharedApplication].statusBarFrame.size;
  }];
  return MIN(statusBarSize.width, statusBarSize.height);
}

- (NSString *)iosVersion
{
  return [UIDevice currentDevice].systemVersion;
}

- (NSString *)userInterfaceIdiom
{
  UIUserInterfaceIdiom idiom = UI_USER_INTERFACE_IDIOM();

  // tv and carplay aren't accounted for here
  switch (idiom) {
    case UIUserInterfaceIdiomPhone:
    return @"handset";
    case UIUserInterfaceIdiomPad:
    return @"tablet";
    default:
    return @"unsupported";
  }
}

- (BOOL)isDevice
{
#if TARGET_IPHONE_SIMULATOR
  return NO;
#endif
  return YES;
}

- (NSArray<NSString *> *)systemFontNames
{
  NSArray<NSString *> *familyNames = [UIFont familyNames];
  NSMutableArray<NSString *> *fontNames = [NSMutableArray array];
  for (NSString *familyName in familyNames) {
    [fontNames addObject:familyName];
    [fontNames addObjectsFromArray:[UIFont fontNamesForFamilyName:familyName]];
  }
  return [fontNames sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
}

# pragma mark - device info

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

+ (NSString *)deviceModel
{
  NSString *platform = [self devicePlatform];
  NSDictionary *mapping = @{
                            // Apple TV
                            @"AppleTV2,1": @"Apple TV 2G",
                            @"AppleTV3,1": @"Apple TV 3G",
                            @"AppleTV3,2": @"Apple TV 3G",
                            @"AppleTV5,3": @"Apple TV 4G",
                            @"AppleTV6,2": @"Apple TV 4k",

                            // Apple Watch
                            @"Watch1,1": @"Apple Watch",
                            @"Watch1,2": @"Apple Watch",
                            @"Watch2,6": @"Apple Watch Series 1",
                            @"Watch2,7": @"Apple Watch Series 1",
                            @"Watch2,3": @"Apple Watch Series 2",
                            @"Watch2,4": @"Apple Watch Series 2",
                            @"Watch3,1": @"Apple Watch Series 3",
                            @"Watch3,2": @"Apple Watch Series 3",
                            @"Watch3,3": @"Apple Watch Series 3",
                            @"Watch3,4": @"Apple Watch Series 3",
                            @"Watch4,1": @"Apple Watch Series 4",
                            @"Watch4,2": @"Apple Watch Series 4",
                            @"Watch4,3": @"Apple Watch Series 4",
                            @"Watch4,4": @"Apple Watch Series 4",

                            // iPhone
                            @"iPhone1,1": @"iPhone",
                            @"iPhone1,2": @"iPhone 3G",
                            @"iPhone2,1": @"iPhone 3GS",
                            @"iPhone3,1": @"iPhone 4",
                            @"iPhone3,2": @"iPhone 4",
                            @"iPhone3,3": @"iPhone 4 (CDMA)",
                            @"iPhone4,1": @"iPhone 4S",
                            @"iPhone5,1": @"iPhone 5 (GSM)",
                            @"iPhone5,2": @"iPhone 5 (GSM+CDMA)",
                            @"iPhone5,3": @"iPhone 5C (GSM)",
                            @"iPhone5,4": @"iPhone 5C (GSM+CDMA)",
                            @"iPhone6,1": @"iPhone 5S (GSM)",
                            @"iPhone6,2": @"iPhone 5S (GSM+CDMA)",
                            @"iPhone7,1": @"iPhone 6 Plus",
                            @"iPhone7,2": @"iPhone 6",
                            @"iPhone8,1": @"iPhone 6s",
                            @"iPhone8,2": @"iPhone 6s Plus",
                            @"iPhone8,4": @"iPhone SE",
                            @"iPhone9,1": @"iPhone 7",
                            @"iPhone9,3": @"iPhone 7",
                            @"iPhone9,2": @"iPhone 7 Plus",
                            @"iPhone9,4": @"iPhone 7 Plus",
                            @"iPhone10,1": @"iPhone 8",
                            @"iPhone10,4": @"iPhone 8",
                            @"iPhone10,2": @"iPhone 8 Plus",
                            @"iPhone10,5": @"iPhone 8 Plus",
                            @"iPhone10,3": @"iPhone X",
                            @"iPhone10,6": @"iPhone X",
                            @"iPhone11,2": @"iPhone Xs",
                            @"iPhone11,4": @"iPhone Xs Max", // A1921, A2103
                            @"iPhone11,6": @"iPhone Xs Max", // A2104
                            @"iPhone11,8": @"iPhone Xr", // A1882, A1719, A2105
                            @"iPhone12,1": @"iPhone 11",
                            @"iPhone12,3": @"iPhone 11 Pro",
                            @"iPhone12,5": @"iPhone 11 Pro Max",

                            // iPod
                            @"iPod1,1": @"iPod Touch",
                            @"iPod2,1": @"iPod Touch 2G",
                            @"iPod3,1": @"iPod Touch 3G",
                            @"iPod4,1": @"iPod Touch 4G",
                            @"iPod5,1": @"iPod Touch 5G",
                            @"iPod7,1": @"iPod Touch 6G",

                            // iPad
                            @"iPad1,1": @"iPad",
                            @"iPad2,1": @"iPad 2 (WiFi)",
                            @"iPad2,2": @"iPad 2 (GSM)",
                            @"iPad2,3": @"iPad 2 (CDMA)",
                            @"iPad2,4": @"iPad 2 (WiFi)",
                            @"iPad2,5": @"iPad Mini (WiFi)",
                            @"iPad2,6": @"iPad Mini (GSM)",
                            @"iPad2,7": @"iPad Mini (GSM+CDMA)",
                            @"iPad3,1": @"iPad 3 (WiFi)",
                            @"iPad3,2": @"iPad 3 (GSM+CDMA)",
                            @"iPad3,3": @"iPad 3 (GSM)",
                            @"iPad3,4": @"iPad 4 (WiFi)",
                            @"iPad3,5": @"iPad 4 (GSM)",
                            @"iPad3,6": @"iPad 4 (GSM+CDMA)",
                            @"iPad4,1": @"iPad Air (WiFi)",
                            @"iPad4,2": @"iPad Air (Cellular)",
                            @"iPad4,3": @"iPad Air",
                            @"iPad4,4": @"iPad Mini 2 (WiFi)",
                            @"iPad4,5": @"iPad Mini 2 (Cellular)",
                            @"iPad4,6": @"iPad Mini 2",
                            @"iPad4,7": @"iPad mini 3 (WiFi)",
                            @"iPad4,8": @"iPad mini 3 (Cellular)",
                            @"iPad4,9": @"iPad mini 3 (China Model)",
                            @"iPad5,1": @"iPad mini 4 (WiFi)",
                            @"iPad5,2": @"iPad mini 4 (Cellular)",
                            @"iPad5,3": @"iPad Air 2 (WiFi)",
                            @"iPad5,4": @"iPad Air 2 (Cellular)",
                            @"iPad6,3": @"iPad Pro 9.7 inch (WiFi)",
                            @"iPad6,4": @"iPad Pro 9.7 inch (Cellular)",
                            @"iPad6,7": @"iPad Pro (WiFi)",
                            @"iPad6,8": @"iPad Pro (Cellular)",
                            @"iPad6,11": @"iPad 5th Generation (WiFi)",
                            @"iPad6,12": @"iPad 5th Generation (Cellular)",
                            @"iPad7,1": @"iPad Pro 12.9 inch (WiFi)",
                            @"iPad7,2": @"iPad Pro 12.9 inch (Cellular)",
                            @"iPad7,3": @"iPad Pro 10.5 inch (WiFi)",
                            @"iPad7,4": @"iPad Pro 10.5 inch (Cellular)",
                            @"iPad7,5": @"iPad 9.7 inch (WiFi)",
                            @"iPad7,6": @"iPad 9.7 inch (Cellular)",

                            // Simulator
                            @"i386": @"Simulator",
                            @"x86_64": @"Simulator",
                            };

  NSString *deviceModel = mapping[platform];

  if (!deviceModel) {
    // Not found in the database. At least guess main device type from string contents.

    if ([platform rangeOfString:@"iPod"].location != NSNotFound) {
      deviceModel = @"iPod Touch";
    } else if ([platform rangeOfString:@"iPad"].location != NSNotFound) {
      deviceModel = @"iPad";
    } else if ([platform rangeOfString:@"iPhone"].location != NSNotFound){
      deviceModel = @"iPhone";
    } else if ([platform rangeOfString:@"AppleTV"].location != NSNotFound){
      deviceModel = @"Apple TV";
    }
  }
  return deviceModel;
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

  // Simulator or unknown - just assume newest device.
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy"];
  NSString *yearString = [formatter stringFromDate:[NSDate date]];

  return @([yearString intValue]);
}

+ (NSString *)deviceName
{
  return [UIDevice currentDevice].name;
}

+ (NSString *)installationId
{
  NSString *uuid = [[NSUserDefaults standardUserDefaults] stringForKey:kEXDeviceInstallUUIDKey];
  if (!uuid) {
    uuid = [[NSUUID UUID] UUIDString];
    [[NSUserDefaults standardUserDefaults] setObject:uuid forKey:kEXDeviceInstallUUIDKey];
  }
  return uuid;
}


@end
