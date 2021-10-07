// Copyright 2015-present 650 Industries. All rights reserved.

#include <sys/types.h>
#include <sys/sysctl.h>
#include <sys/utsname.h>

#import <ExpoModulesCore/EXUtilities.h>
#import <EXConstants/EXConstantsService.h>
#import <EXConstants/EXConstantsInstallationIdProvider.h>

NSString * const EXConstantsExecutionEnvironmentBare = @"bare";
NSString * const EXConstantsExecutionEnvironmentStandalone = @"standalone";
NSString * const EXConstantsExecutionEnvironmentStoreClient = @"storeClient";

@interface EXConstantsService ()

@property (nonatomic, strong) NSString *sessionId;
@property (nonatomic, strong) EXConstantsInstallationIdProvider *installationIdProvider;

@end

@implementation EXConstantsService

- (instancetype)init
{
  return [self initWithInstallationIdProvider:[[EXConstantsInstallationIdProvider alloc] init]];
}

- (instancetype)initWithInstallationIdProvider:(EXConstantsInstallationIdProvider *)installationIdProvider
{
  if (self = [super init]) {
    _installationIdProvider = installationIdProvider;
  }
  return self;
}

EX_REGISTER_MODULE();

+ (const NSArray<Protocol *> *)exportedInterfaces
{
  return @[@protocol(EXConstantsInterface)];
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
           @"executionEnvironment": EXConstantsExecutionEnvironmentBare,
           @"statusBarHeight": @([self statusBarHeight]),
           @"deviceYearClass": [[self class] deviceYear],
           @"deviceName": [[self class] deviceName],
           @"isDevice": @([self isDevice]),
           @"systemFonts": [self systemFontNames],
           @"debugMode": @(isDebugXCodeScheme),
           @"isHeadless": @(NO),
           @"nativeAppVersion": [self appVersion],
           @"nativeBuildVersion": [self buildVersion],
           @"installationId": [_installationIdProvider getOrCreateInstallationId],
           @"manifest": EXNullIfNil([[self class] appConfig]),
           @"platform": @{
               @"ios": @{
                   @"buildNumber": [self buildVersion],
                   @"platform": [[self class] devicePlatform],
                   @"model": EXNullIfNil([[self class] modelName]),
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
    // "System Font" is added to [UIFont familyNames] in iOS 15, and the font names that
    // correspond with it are dot prefixed .SFUI-* fonts which log the following warning
    // when passed in to [UIFont fontNamesForFamilyName:name]:
    // CoreText note: Client requested name “.SFUI-HeavyItalic”, it will get TimesNewRomanPSMT rather than the intended font.
    // All system UI font access should be through proper APIs such as CTFontCreateUIFontForLanguage() or +[UIFont systemFontOfSize:]
    //
    if (![familyName isEqualToString:@"System Font"]) {
      [fontNames addObject:familyName];
      [fontNames addObjectsFromArray:[UIFont fontNamesForFamilyName:familyName]];
    }
  }

  // Remove duplciates and sort alphabetically
  return [[[NSSet setWithArray:fontNames] allObjects] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
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
  NSString *platform = [self devicePlatform];
  
  // TODO: Apple TV and Apple watch
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
  NSString *platform = [self devicePlatform];
  
  // TODO: Apple TV and Apple watch
  NSDictionary *mapping = [self getDeviceMap];
    
  if (mapping[platform]) {
    return mapping[platform][@"year"];
  }
  
  // Simulator or unknown - assume this is the newest device
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy"];
  NSString *yearString = [formatter stringFromDate:[NSDate date]];
  
  return @([yearString intValue]);
}

+ (NSString *)deviceName
{
  return [UIDevice currentDevice].name;
}

+ (NSDictionary *)appConfig
{
  NSBundle *frameworkBundle = [NSBundle bundleForClass:[EXConstantsService class]];
  NSURL *bundleUrl = [frameworkBundle.resourceURL URLByAppendingPathComponent:@"EXConstants.bundle"];
  NSBundle *bundle = [NSBundle bundleWithURL:bundleUrl];
  NSString *path = [bundle pathForResource:@"app" ofType:@"config"];
  if (path) {
    NSData *configData = [NSData dataWithContentsOfFile:path];
    if (configData) {
      NSError *error;
      NSDictionary *configObject = [NSJSONSerialization JSONObjectWithData:configData options:kNilOptions error:&error];
      if (!configObject || ![configObject isKindOfClass:[NSDictionary class]]) {
        NSLog(@"Error reading embedded app config: %@", error.localizedDescription ?: @"config is not an object");
        return nil;
      }
      return configObject;
    }
  }
  return nil;
}


@end
