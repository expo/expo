// Copyright 2015-present 650 Industries. All rights reserved.

#include <sys/types.h>
#include <sys/sysctl.h>
#include <sys/utsname.h>

#import <ExpoModulesCore/EXUtilities.h>
#import <EXConstants/EXConstantsService.h>
#import <EXConstants/EXConstantsInstallationIdProvider.h>

NSString * const EXConstantsExecutionEnvironmentBare = @"bare";
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
           @"deviceName": [[self class] deviceName],
           @"isDevice": @([self isDevice]),
           @"systemFonts": [self systemFontNames],
           @"debugMode": @(isDebugXCodeScheme),
           @"isHeadless": @(NO),
           @"nativeAppVersion": [self appVersion],
           @"nativeBuildVersion": EXNullIfNil([self buildVersion]),
           @"installationId": EXNullIfNil([_installationIdProvider getOrCreateInstallationId]),
           @"manifest": EXNullIfNil([[self class] appConfig]),
           @"platform": @{
               @"ios": @{
                   @"buildNumber": EXNullIfNil([self buildVersion]),
                   @"platform": [[self class] devicePlatform],
                   @"userInterfaceIdiom": [self userInterfaceIdiom],
                   @"systemVersion": EXNullIfNil([self iosVersion]),
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
#if TARGET_OS_IOS
  __block CGSize statusBarSize;
  [EXUtilities performSynchronouslyOnMainThread:^{
    statusBarSize = [UIApplication sharedApplication].statusBarFrame.size;
  }];
  return MIN(statusBarSize.width, statusBarSize.height);
#elif TARGET_OS_OSX || TARGET_OS_TV
  return 0;
#endif
}

- (NSString *)iosVersion
{
#if TARGET_OS_IOS || TARGET_OS_TV
  return [UIDevice currentDevice].systemVersion;
#else
  return nil;
#endif
}

- (NSString *)userInterfaceIdiom
{
#if TARGET_OS_IOS || TARGET_OS_TV
  UIUserInterfaceIdiom idiom = UI_USER_INTERFACE_IDIOM();

  switch (idiom) {
    case UIUserInterfaceIdiomTV:
      return @"tv";
    case UIUserInterfaceIdiomPhone:
      return @"handset";
    case UIUserInterfaceIdiomPad:
      return @"tablet";
    default:
      return @"unsupported";
  }
#elif TARGET_OS_OSX
  return @"desktop";
#endif
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
#if TARGET_OS_IOS || TARGET_OS_TV
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

  // Remove duplicates and sort alphabetically
  return [[[NSSet setWithArray:fontNames] allObjects] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
#elif TARGET_OS_OSX
  return [[NSFontManager sharedFontManager] availableFontFamilies];
#endif
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

+ (NSString *)deviceName
{
#if TARGET_OS_IOS || TARGET_OS_TV
  return [UIDevice currentDevice].name;
#elif TARGET_OS_OSX
  return [NSHost currentHost].localizedName;
#endif
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
