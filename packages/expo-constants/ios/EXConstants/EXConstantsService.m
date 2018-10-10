// Copyright 2015-present 650 Industries. All rights reserved.

#include <sys/types.h>
#include <sys/sysctl.h>

#import <EXCore/EXUtilities.h>
#import <EXConstants/EXConstantsService.h>

@interface EXConstantsService ()

@property (nonatomic, strong) NSString *sessionId;

@end

@implementation EXConstantsService

- (instancetype)initWithExperienceId:(NSString *)experienceId
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXConstantsInterface)];
}

- (NSDictionary *)constants
{
  if (!_sessionId) {
    _sessionId = [[NSUUID UUID] UUIDString];
  }
  return @{
           @"sessionId": _sessionId,
           @"statusBarHeight": @([self statusBarHeight]),
           @"deviceYearClass": [[self class] deviceYear],
           @"deviceName": [[self class] deviceName],
           @"isDevice": @([self isDevice]),
           @"systemFonts": [self systemFontNames],
           @"platform": @{
               @"ios": @{
                   @"buildNumber": [self buildNumber],
                   @"platform": [[self class] devicePlatform],
                   @"model": [[self class] deviceModel],
                   @"userInterfaceIdiom": [self userInterfaceIdiom],
                   @"systemVersion": [self iosVersion],
                   },
               },
           };
}

- (NSString *)buildNumber
{
  // always get this constant from the embedded Info.plist
  // because the one in the manifest can get updated later.
  return [[[NSBundle mainBundle] infoDictionary] objectForKey:@"CFBundleVersion"];
}

- (CGFloat)statusBarHeight
{
  __block CGSize statusBarSize;
  [EXUtilities performSynchronouslyOnMainThread:^{
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
  
  // Apple TV
  if ([platform isEqualToString:@"AppleTV2,1"])   return @"Apple TV 2G";
  if ([platform isEqualToString:@"AppleTV3,1"])   return @"Apple TV 3G";
  if ([platform isEqualToString:@"AppleTV3,2"])   return @"Apple TV 3G";
  if ([platform isEqualToString:@"AppleTV5,3"])   return @"Apple TV 4G";
  if ([platform isEqualToString:@"AppleTV6,2"])   return @"Apple TV 4k";
  
  // Apple Watch
  if ([platform isEqualToString:@"Watch1,1"])     return @"Apple Watch";
  if ([platform isEqualToString:@"Watch1,2"])     return @"Apple Watch";
  if ([platform isEqualToString:@"Watch2,6"])     return @"Apple Watch Series 1";
  if ([platform isEqualToString:@"Watch2,7"])     return @"Apple Watch Series 1";
  if ([platform isEqualToString:@"Watch2,3"])     return @"Apple Watch Series 2";
  if ([platform isEqualToString:@"Watch2,4"])     return @"Apple Watch Series 2";
  if ([platform isEqualToString:@"Watch3,1"])     return @"Apple Watch Series 3";
  if ([platform isEqualToString:@"Watch3,2"])     return @"Apple Watch Series 3";
  if ([platform isEqualToString:@"Watch3,3"])     return @"Apple Watch Series 3";
  if ([platform isEqualToString:@"Watch3,4"])     return @"Apple Watch Series 3";
  
  // iPhone
  if ([platform isEqualToString:@"iPhone1,1"])    return @"iPhone";
  if ([platform isEqualToString:@"iPhone1,2"])    return @"iPhone 3G";
  if ([platform isEqualToString:@"iPhone2,1"])    return @"iPhone 3GS";
  if ([platform isEqualToString:@"iPhone3,1"])    return @"iPhone 4";
  if ([platform isEqualToString:@"iPhone3,2"])    return @"iPhone 4";
  if ([platform isEqualToString:@"iPhone3,3"])    return @"iPhone 4 (CDMA)";
  if ([platform isEqualToString:@"iPhone4,1"])    return @"iPhone 4S";
  if ([platform isEqualToString:@"iPhone5,1"])    return @"iPhone 5 (GSM)";
  if ([platform isEqualToString:@"iPhone5,2"])    return @"iPhone 5 (GSM+CDMA)";
  if ([platform isEqualToString:@"iPhone5,3"])    return @"iPhone 5C (GSM)";
  if ([platform isEqualToString:@"iPhone5,4"])    return @"iPhone 5C (GSM+CDMA)";
  if ([platform isEqualToString:@"iPhone6,1"])    return @"iPhone 5S (GSM)";
  if ([platform isEqualToString:@"iPhone6,2"])    return @"iPhone 5S (GSM+CDMA)";
  if ([platform isEqualToString:@"iPhone7,1"])    return @"iPhone 6 Plus";
  if ([platform isEqualToString:@"iPhone7,2"])    return @"iPhone 6";
  if ([platform isEqualToString:@"iPhone8,1"])    return @"iPhone 6s";
  if ([platform isEqualToString:@"iPhone8,2"])    return @"iPhone 6s Plus";
  if ([platform isEqualToString:@"iPhone8,4"])    return @"iPhone SE";
  if ([platform isEqualToString:@"iPhone9,1"])    return @"iPhone 7";
  if ([platform isEqualToString:@"iPhone9,3"])    return @"iPhone 7";
  if ([platform isEqualToString:@"iPhone9,2"])    return @"iPhone 7 Plus";
  if ([platform isEqualToString:@"iPhone9,4"])    return @"iPhone 7 Plus";
  
  if ([platform isEqualToString:@"iPhone10,1"])    return @"iPhone 8";
  if ([platform isEqualToString:@"iPhone10,4"])    return @"iPhone 8";
  if ([platform isEqualToString:@"iPhone10,2"])    return @"iPhone 8 Plus";
  if ([platform isEqualToString:@"iPhone10,5"])    return @"iPhone 8 Plus";
  if ([platform isEqualToString:@"iPhone10,3"])    return @"iPhone X";
  if ([platform isEqualToString:@"iPhone10,6"])    return @"iPhone X";
  
  // iPod
  if ([platform isEqualToString:@"iPod1,1"])      return @"iPod Touch";
  if ([platform isEqualToString:@"iPod2,1"])      return @"iPod Touch 2G";
  if ([platform isEqualToString:@"iPod3,1"])      return @"iPod Touch 3G";
  if ([platform isEqualToString:@"iPod4,1"])      return @"iPod Touch 4G";
  if ([platform isEqualToString:@"iPod5,1"])      return @"iPod Touch 5G";
  if ([platform isEqualToString:@"iPod7,1"])      return @"iPod Touch 6G";
  
  // iPad
  if ([platform isEqualToString:@"iPad1,1"])      return @"iPad";
  if ([platform isEqualToString:@"iPad2,1"])      return @"iPad 2 (WiFi)";
  if ([platform isEqualToString:@"iPad2,2"])      return @"iPad 2 (GSM)";
  if ([platform isEqualToString:@"iPad2,3"])      return @"iPad 2 (CDMA)";
  if ([platform isEqualToString:@"iPad2,4"])      return @"iPad 2 (WiFi)";
  if ([platform isEqualToString:@"iPad3,1"])      return @"iPad 3 (WiFi)";
  if ([platform isEqualToString:@"iPad3,2"])      return @"iPad 3 (GSM+CDMA)";
  if ([platform isEqualToString:@"iPad3,3"])      return @"iPad 3 (GSM)";
  if ([platform isEqualToString:@"iPad3,4"])      return @"iPad 4 (WiFi)";
  if ([platform isEqualToString:@"iPad3,5"])      return @"iPad 4 (GSM)";
  if ([platform isEqualToString:@"iPad3,6"])      return @"iPad 4 (GSM+CDMA)";
  if ([platform isEqualToString:@"iPad4,1"])      return @"iPad Air (WiFi)";
  if ([platform isEqualToString:@"iPad4,2"])      return @"iPad Air (Cellular)";
  if ([platform isEqualToString:@"iPad4,3"])      return @"iPad Air";
  if ([platform isEqualToString:@"iPad5,3"])      return @"iPad Air 2 (WiFi)";
  if ([platform isEqualToString:@"iPad5,4"])      return @"iPad Air 2 (Cellular)";
  if ([platform isEqualToString:@"iPad6,3"])      return @"iPad Pro 9.7 inch (WiFi)";
  if ([platform isEqualToString:@"iPad6,4"])      return @"iPad Pro 9.7 inch (Cellular)";
  if ([platform isEqualToString:@"iPad6,7"])      return @"iPad Pro (WiFi)";
  if ([platform isEqualToString:@"iPad6,8"])      return @"iPad Pro (Cellular)";
  if ([platform isEqualToString:@"iPad6,11"])     return @"iPad 5th Generation (WiFi)";
  if ([platform isEqualToString:@"iPad6,12"])     return @"iPad 5th Generation (Cellular)";
  if ([platform isEqualToString:@"iPad7,1"])      return @"iPad Pro 12.9 inch (WiFi)";
  if ([platform isEqualToString:@"iPad7,2"])      return @"iPad Pro 12.9 inch (Cellular)";
  if ([platform isEqualToString:@"iPad7,3"])      return @"iPad Pro 10.5 inch (WiFi)";
  if ([platform isEqualToString:@"iPad7,4"])      return @"iPad Pro 10.5 inch (Cellular)";
  
  // iPad Mini
  if ([platform isEqualToString:@"iPad2,5"])      return @"iPad Mini (WiFi)";
  if ([platform isEqualToString:@"iPad2,6"])      return @"iPad Mini (GSM)";
  if ([platform isEqualToString:@"iPad2,7"])      return @"iPad Mini (GSM+CDMA)";
  if ([platform isEqualToString:@"iPad4,4"])      return @"iPad Mini 2 (WiFi)";
  if ([platform isEqualToString:@"iPad4,5"])      return @"iPad Mini 2 (Cellular)";
  if ([platform isEqualToString:@"iPad4,6"])      return @"iPad Mini 2";
  if ([platform isEqualToString:@"iPad4,7"])      return @"iPad mini 3 (WiFi)";
  if ([platform isEqualToString:@"iPad4,8"])      return @"iPad mini 3 (Cellular)";
  if ([platform isEqualToString:@"iPad4,9"])      return @"iPad mini 3 (China Model)";
  if ([platform isEqualToString:@"iPad5,1"])      return @"iPad mini 4 (WiFi)";
  if ([platform isEqualToString:@"iPad5,2"])      return @"iPad mini 4 (Cellular)";
  
  // Simulator
  if ([platform isEqualToString:@"i386"])         return @"Simulator";
  if ([platform isEqualToString:@"x86_64"])       return @"Simulator";
  
  return @"";
}

+ (NSNumber *)deviceYear
{
  NSString *platform = [self devicePlatform];
  
  // TODO: apple TV and apple watch
  
  // iPhone 1
  if ([platform isEqualToString:@"iPhone1,1"])    return @2007;
  
  // iPhone 3G
  if ([platform isEqualToString:@"iPhone1,2"])    return @2008;
  
  // iPhone 3GS
  if ([platform isEqualToString:@"iPhone2,1"])    return @2009;
  
  // iPhone 4
  if ([platform isEqualToString:@"iPhone3,1"])    return @2010;
  if ([platform isEqualToString:@"iPhone3,2"])    return @2010;
  if ([platform isEqualToString:@"iPhone3,3"])    return @2010;
  
  // iPhone 4S
  if ([platform isEqualToString:@"iPhone4,1"])    return @2011;
  
  // iPhone 5
  if ([platform isEqualToString:@"iPhone5,1"])    return @2012;
  if ([platform isEqualToString:@"iPhone5,2"])    return @2012;
  
  // iPhone 5S and 5C
  if ([platform isEqualToString:@"iPhone5,3"])    return @2013;
  if ([platform isEqualToString:@"iPhone5,4"])    return @2013;
  if ([platform isEqualToString:@"iPhone6,1"])    return @2013;
  if ([platform isEqualToString:@"iPhone6,2"])    return @2013;
  
  // iPhone 6 and 6 Plus
  if ([platform isEqualToString:@"iPhone7,1"])    return @2014;
  if ([platform isEqualToString:@"iPhone7,2"])    return @2014;
  
  // iPhone 6S and 6S Plus
  if ([platform isEqualToString:@"iPhone8,1"])    return @2015;
  if ([platform isEqualToString:@"iPhone8,2"])    return @2015;
  
  // iPhone SE
  if ([platform isEqualToString:@"iPhone8,4"])    return @2016;
  
  // iPhone 7 and 7 Plus
  if ([platform isEqualToString:@"iPhone9,1"])    return @2016;
  if ([platform isEqualToString:@"iPhone9,3"])    return @2016;
  if ([platform isEqualToString:@"iPhone9,2"])    return @2016;
  if ([platform isEqualToString:@"iPhone9,4"])    return @2016;
  
  // iPhone 8, 8 Plus, X
  if ([platform isEqualToString:@"iPhone10,1"])    return @2017;
  if ([platform isEqualToString:@"iPhone10,2"])    return @2017;
  if ([platform isEqualToString:@"iPhone10,3"])    return @2017;
  if ([platform isEqualToString:@"iPhone10,4"])    return @2017;
  if ([platform isEqualToString:@"iPhone10,5"])    return @2017;
  if ([platform isEqualToString:@"iPhone10,6"])    return @2017;
  
  
  // iPod
  if ([platform isEqualToString:@"iPod1,1"])      return @2007;
  if ([platform isEqualToString:@"iPod2,1"])      return @2008;
  if ([platform isEqualToString:@"iPod3,1"])      return @2009;
  if ([platform isEqualToString:@"iPod4,1"])      return @2010;
  if ([platform isEqualToString:@"iPod5,1"])      return @2012;
  if ([platform isEqualToString:@"iPod7,1"])      return @2015;
  
  // iPad
  if ([platform isEqualToString:@"iPad1,1"])      return @2010;
  if ([platform isEqualToString:@"iPad2,1"])      return @2011;
  if ([platform isEqualToString:@"iPad2,2"])      return @2011;
  if ([platform isEqualToString:@"iPad2,3"])      return @2011;
  if ([platform isEqualToString:@"iPad2,4"])      return @2011;
  if ([platform isEqualToString:@"iPad3,1"])      return @2012;
  if ([platform isEqualToString:@"iPad3,2"])      return @2012;
  if ([platform isEqualToString:@"iPad3,3"])      return @2012;
  if ([platform isEqualToString:@"iPad3,4"])      return @2013;
  if ([platform isEqualToString:@"iPad3,5"])      return @2013;
  if ([platform isEqualToString:@"iPad3,6"])      return @2013;
  if ([platform isEqualToString:@"iPad4,1"])      return @2013;
  if ([platform isEqualToString:@"iPad4,2"])      return @2013;
  if ([platform isEqualToString:@"iPad4,3"])      return @2013;
  if ([platform isEqualToString:@"iPad5,3"])      return @2014;
  if ([platform isEqualToString:@"iPad5,4"])      return @2014;
  if ([platform isEqualToString:@"iPad6,7"])      return @2015;
  if ([platform isEqualToString:@"iPad6,8"])      return @2015;
  if ([platform isEqualToString:@"iPad6,3"])      return @2016;
  if ([platform isEqualToString:@"iPad6,4"])      return @2016;
  if ([platform isEqualToString:@"iPad6,11"])     return @2017;
  if ([platform isEqualToString:@"iPad6,12"])     return @2017;
  if ([platform isEqualToString:@"iPad7,1"])      return @2017;
  if ([platform isEqualToString:@"iPad7,2"])      return @2017;
  if ([platform isEqualToString:@"iPad7,3"])      return @2017;
  if ([platform isEqualToString:@"iPad7,4"])      return @2017;
  
  // iPad Mini
  if ([platform isEqualToString:@"iPad2,5"])      return @2012;
  if ([platform isEqualToString:@"iPad2,6"])      return @2012;
  if ([platform isEqualToString:@"iPad2,7"])      return @2012;
  if ([platform isEqualToString:@"iPad4,4"])      return @2013;
  if ([platform isEqualToString:@"iPad4,5"])      return @2013;
  if ([platform isEqualToString:@"iPad4,6"])      return @2013;
  if ([platform isEqualToString:@"iPad4,7"])      return @2014;
  if ([platform isEqualToString:@"iPad4,8"])      return @2014;
  if ([platform isEqualToString:@"iPad4,9"])      return @2014;
  if ([platform isEqualToString:@"iPad5,1"])      return @2015;
  if ([platform isEqualToString:@"iPad5,2"])      return @2015;
  
  // Simulator or unknown-- just assume newest device
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy"];
  NSString *yearString = [formatter stringFromDate:[NSDate date]];
  
  return @([yearString intValue]);
}

+ (NSString *)deviceName
{
  return [UIDevice currentDevice].name;
}

@end
