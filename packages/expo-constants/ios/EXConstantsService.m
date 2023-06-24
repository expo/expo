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
