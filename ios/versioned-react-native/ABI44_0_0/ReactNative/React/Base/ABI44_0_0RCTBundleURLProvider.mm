/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI44_0_0RCTBundleURLProvider.h"

#import "ABI44_0_0RCTConvert.h"
#import "ABI44_0_0RCTDefines.h"

NSString *const ABI44_0_0RCTBundleURLProviderUpdatedNotification = @"ABI44_0_0RCTBundleURLProviderUpdatedNotification";

const NSUInteger kABI44_0_0RCTBundleURLProviderDefaultPort = ABI44_0_0RCT_METRO_PORT;

static NSString *const kABI44_0_0RCTJsLocationKey = @"ABI44_0_0RCT_jsLocation";
// This option is no longer exposed in the dev menu UI.
// It was renamed in D15958697 so it doesn't get stuck with no way to turn it off:
static NSString *const kABI44_0_0RCTEnableLiveReloadKey = @"ABI44_0_0RCT_enableLiveReload_LEGACY";
static NSString *const kABI44_0_0RCTEnableDevKey = @"ABI44_0_0RCT_enableDev";
static NSString *const kABI44_0_0RCTEnableMinificationKey = @"ABI44_0_0RCT_enableMinification";

@implementation ABI44_0_0RCTBundleURLProvider

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self setDefaults];
  }
  return self;
}

- (NSDictionary *)defaults
{
  return @{
    kABI44_0_0RCTEnableLiveReloadKey : @NO,
    kABI44_0_0RCTEnableDevKey : @YES,
    kABI44_0_0RCTEnableMinificationKey : @NO,
  };
}

- (void)settingsUpdated
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI44_0_0RCTBundleURLProviderUpdatedNotification object:self];
}

- (void)setDefaults
{
  [[NSUserDefaults standardUserDefaults] registerDefaults:[self defaults]];
}

- (void)resetToDefaults
{
  for (NSString *key in [[self defaults] allKeys]) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:key];
  }
  [self setDefaults];
  [self settingsUpdated];
}

static NSURL *serverRootWithHostPort(NSString *hostPort)
{
  if ([hostPort rangeOfString:@":"].location != NSNotFound) {
    return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@/", hostPort]];
  }
  return [NSURL
      URLWithString:[NSString
                        stringWithFormat:@"http://%@:%lu/", hostPort, (unsigned long)kABI44_0_0RCTBundleURLProviderDefaultPort]];
}

#if ABI44_0_0RCT_DEV_MENU
+ (BOOL)isPackagerRunning:(NSString *)hostPort
{
  NSURL *url = [serverRootWithHostPort(hostPort) URLByAppendingPathComponent:@"status"];

  NSURLSession *session = [NSURLSession sharedSession];
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  __block NSURLResponse *response;
  __block NSData *data;

  dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
  [[session dataTaskWithRequest:request
              completionHandler:^(NSData *d, NSURLResponse *res, __unused NSError *err) {
                data = d;
                response = res;
                dispatch_semaphore_signal(semaphore);
              }] resume];
  dispatch_semaphore_wait(semaphore, DISPATCH_TIME_FOREVER);

  NSString *status = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  return [status isEqualToString:@"packager-status:running"];
}

- (NSString *)guessPackagerHost
{
  static NSString *ipGuess;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
    ipGuess =
        [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding
                                      error:nil] stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  });

  NSString *host = ipGuess ?: @"localhost";
  if ([ABI44_0_0RCTBundleURLProvider isPackagerRunning:host]) {
    return host;
  }
  return nil;
}
#else
+ (BOOL)isPackagerRunning:(NSString *)hostPort
{
  return false;
}
#endif

- (NSString *)packagerServerHost
{
  NSString *location = [self packagerServerHostPort];
  if (location) {
    NSInteger index = [location rangeOfString:@":"].location;
    if (index != NSNotFound) {
      location = [location substringToIndex:index];
    }
  }
  return location;
}

- (NSString *)packagerServerHostPort
{
  NSString *location = [self jsLocation];
#if ABI44_0_0RCT_DEV_MENU
  if ([location length] && ![ABI44_0_0RCTBundleURLProvider isPackagerRunning:location]) {
    location = nil;
  }
#endif
  if (location != nil) {
    return location;
  }
#if ABI44_0_0RCT_DEV
  NSString *host = [self guessPackagerHost];
  if (host) {
    return host;
  }
#endif
  return nil;
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackURLProvider:(NSURL * (^)(void))fallbackURLProvider
{
  NSString *packagerServerHostPort = [self packagerServerHostPort];
  if (!packagerServerHostPort) {
    return fallbackURLProvider();
  } else {
    return [ABI44_0_0RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                             packagerHost:packagerServerHostPort
                                                enableDev:[self enableDev]
                                       enableMinification:[self enableMinification]];
  }
}

- (NSURL *)jsBundleURLForSplitBundleRoot:(NSString *)bundleRoot
{
  return [ABI44_0_0RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                           packagerHost:[self packagerServerHostPort]
                                              enableDev:[self enableDev]
                                     enableMinification:[self enableMinification]
                                            modulesOnly:YES
                                              runModule:NO];
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                   fallbackResource:(NSString *)resourceName
                  fallbackExtension:(NSString *)extension
{
  return [self jsBundleURLForBundleRoot:bundleRoot
                    fallbackURLProvider:^NSURL * {
                      return [self jsBundleURLForFallbackResource:resourceName fallbackExtension:extension];
                    }];
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName
{
  return [self jsBundleURLForBundleRoot:bundleRoot fallbackResource:resourceName fallbackExtension:nil];
}

- (NSURL *)jsBundleURLForFallbackResource:(NSString *)resourceName fallbackExtension:(NSString *)extension
{
  resourceName = resourceName ?: @"main";
  extension = extension ?: @"jsbundle";
  return [[NSBundle mainBundle] URLForResource:resourceName withExtension:extension];
}

- (NSURL *)resourceURLForResourceRoot:(NSString *)root
                         resourceName:(NSString *)name
                    resourceExtension:(NSString *)extension
                        offlineBundle:(NSBundle *)offlineBundle
{
  NSString *packagerServerHostPort = [self packagerServerHostPort];
  if (!packagerServerHostPort) {
    // Serve offline bundle (local file)
    NSBundle *bundle = offlineBundle ?: [NSBundle mainBundle];
    return [bundle URLForResource:name withExtension:extension];
  }
  NSString *path = [NSString stringWithFormat:@"/%@/%@.%@", root, name, extension];
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerServerHostPort query:nil];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification

{
  return [self jsBundleURLForBundleRoot:bundleRoot
                           packagerHost:packagerHost
                              enableDev:enableDev
                     enableMinification:enableMinification
                            modulesOnly:NO
                              runModule:YES];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
                        modulesOnly:(BOOL)modulesOnly
                          runModule:(BOOL)runModule
{
  NSString *path = [NSString stringWithFormat:@"/%@.bundle", bundleRoot];
#ifdef HERMES_BYTECODE_VERSION
  NSString *runtimeBytecodeVersion = [NSString stringWithFormat:@"&runtimeBytecodeVersion=%u", HERMES_BYTECODE_VERSION];
#else
  NSString *runtimeBytecodeVersion = @"";
#endif

  // When we support only iOS 8 and above, use queryItems for a better API.
  NSString *query = [NSString stringWithFormat:@"platform=ios&dev=%@&minify=%@&modulesOnly=%@&runModule=%@%@",
                                               enableDev ? @"true" : @"false",
                                               enableMinification ? @"true" : @"false",
                                               modulesOnly ? @"true" : @"false",
                                               runModule ? @"true" : @"false",
                                               runtimeBytecodeVersion];

  NSString *bundleID = [[NSBundle mainBundle] objectForInfoDictionaryKey:(NSString *)kCFBundleIdentifierKey];
  if (bundleID) {
    query = [NSString stringWithFormat:@"%@&app=%@", query, bundleID];
  }
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerHost query:query];
}

+ (NSURL *)resourceURLForResourcePath:(NSString *)path packagerHost:(NSString *)packagerHost query:(NSString *)query
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:serverRootWithHostPort(packagerHost)
                                           resolvingAgainstBaseURL:NO];
  components.path = path;
  if (query != nil) {
    components.query = query;
  }
  return components.URL;
}

- (void)updateValue:(id)object forKey:(NSString *)key
{
  [[NSUserDefaults standardUserDefaults] setObject:object forKey:key];
  [[NSUserDefaults standardUserDefaults] synchronize];
  [self settingsUpdated];
}

- (BOOL)enableDev
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI44_0_0RCTEnableDevKey];
}

- (BOOL)enableLiveReload
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI44_0_0RCTEnableLiveReloadKey];
}

- (BOOL)enableMinification
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI44_0_0RCTEnableMinificationKey];
}

- (NSString *)jsLocation
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kABI44_0_0RCTJsLocationKey];
}

- (void)setEnableDev:(BOOL)enableDev
{
  [self updateValue:@(enableDev) forKey:kABI44_0_0RCTEnableDevKey];
}

- (void)setEnableLiveReload:(BOOL)enableLiveReload
{
  [self updateValue:@(enableLiveReload) forKey:kABI44_0_0RCTEnableLiveReloadKey];
}

- (void)setJsLocation:(NSString *)jsLocation
{
  [self updateValue:jsLocation forKey:kABI44_0_0RCTJsLocationKey];
}

- (void)setEnableMinification:(BOOL)enableMinification
{
  [self updateValue:@(enableMinification) forKey:kABI44_0_0RCTEnableMinificationKey];
}

+ (instancetype)sharedSettings
{
  static ABI44_0_0RCTBundleURLProvider *sharedInstance;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    sharedInstance = [ABI44_0_0RCTBundleURLProvider new];
  });
  return sharedInstance;
}

@end
