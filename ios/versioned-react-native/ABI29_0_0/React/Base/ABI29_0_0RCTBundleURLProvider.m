/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RCTBundleURLProvider.h"

#import "ABI29_0_0RCTConvert.h"
#import "ABI29_0_0RCTDefines.h"

NSString *const ABI29_0_0RCTBundleURLProviderUpdatedNotification = @"ABI29_0_0RCTBundleURLProviderUpdatedNotification";

const NSUInteger kABI29_0_0RCTBundleURLProviderDefaultPort = ABI29_0_0RCT_METRO_PORT;

static NSString *const kABI29_0_0RCTJsLocationKey = @"ABI29_0_0RCT_jsLocation";
static NSString *const kABI29_0_0RCTEnableLiveReloadKey = @"ABI29_0_0RCT_enableLiveReload";
static NSString *const kABI29_0_0RCTEnableDevKey = @"ABI29_0_0RCT_enableDev";
static NSString *const kABI29_0_0RCTEnableMinificationKey = @"ABI29_0_0RCT_enableMinification";

@implementation ABI29_0_0RCTBundleURLProvider

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
    kABI29_0_0RCTEnableLiveReloadKey: @NO,
    kABI29_0_0RCTEnableDevKey: @YES,
    kABI29_0_0RCTEnableMinificationKey: @NO,
  };
}

- (void)settingsUpdated
{
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI29_0_0RCTBundleURLProviderUpdatedNotification object:self];
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

static NSURL *serverRootWithHost(NSString *host)
{
  return [NSURL URLWithString:
          [NSString stringWithFormat:@"http://%@:%lu/",
           host, (unsigned long)kABI29_0_0RCTBundleURLProviderDefaultPort]];
}

#if ABI29_0_0RCT_DEV
- (BOOL)isPackagerRunning:(NSString *)host
{
  NSURL *url = [serverRootWithHost(host) URLByAppendingPathComponent:@"status"];
  NSURLRequest *request = [NSURLRequest requestWithURL:url];
  NSURLResponse *response;
  NSData *data = [NSURLConnection sendSynchronousRequest:request returningResponse:&response error:NULL];
  NSString *status = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  return [status isEqualToString:@"packager-status:running"];
}

- (NSString *)guessPackagerHost
{
  static NSString *ipGuess;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *ipPath = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
    ipGuess = [[NSString stringWithContentsOfFile:ipPath encoding:NSUTF8StringEncoding error:nil]
               stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  });

  NSString *host = ipGuess ?: @"localhost";
  if ([self isPackagerRunning:host]) {
    return host;
  }
  return nil;
}
#endif

- (NSString *)packagerServerHost
{
  NSString *location = [self jsLocation];
  if (location != nil) {
    return location;
  }
#if ABI29_0_0RCT_DEV
  NSString *host = [self guessPackagerHost];
  if (host) {
    return host;
  }
#endif
  return nil;
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName fallbackExtension:(NSString *)extension
{
  NSString *packagerServerHost = [self packagerServerHost];
  if (!packagerServerHost) {
    return [self jsBundleURLForFallbackResource:resourceName fallbackExtension:extension];
  } else {
    return [ABI29_0_0RCTBundleURLProvider jsBundleURLForBundleRoot:bundleRoot
                                             packagerHost:packagerServerHost
                                                enableDev:[self enableDev]
                                       enableMinification:[self enableMinification]];
  }
}

- (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot fallbackResource:(NSString *)resourceName
{
  return [self jsBundleURLForBundleRoot:bundleRoot fallbackResource:resourceName fallbackExtension:nil];
}

- (NSURL *)jsBundleURLForFallbackResource:(NSString *)resourceName
                        fallbackExtension:(NSString *)extension
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
  NSString *packagerServerHost = [self packagerServerHost];
  if (!packagerServerHost) {
    // Serve offline bundle (local file)
    NSBundle *bundle = offlineBundle ?: [NSBundle mainBundle];
    return [bundle URLForResource:name withExtension:extension];
  }
  NSString *path = [NSString stringWithFormat:@"/%@/%@.%@", root, name, extension];
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerServerHost query:nil];
}

+ (NSURL *)jsBundleURLForBundleRoot:(NSString *)bundleRoot
                       packagerHost:(NSString *)packagerHost
                          enableDev:(BOOL)enableDev
                 enableMinification:(BOOL)enableMinification
{
  NSString *path = [NSString stringWithFormat:@"/%@.bundle", bundleRoot];
  // When we support only iOS 8 and above, use queryItems for a better API.
  NSString *query = [NSString stringWithFormat:@"platform=ios&dev=%@&minify=%@",
                      enableDev ? @"true" : @"false",
                      enableMinification ? @"true": @"false"];
  return [[self class] resourceURLForResourcePath:path packagerHost:packagerHost query:query];
}

+ (NSURL *)resourceURLForResourcePath:(NSString *)path
                         packagerHost:(NSString *)packagerHost
                                query:(NSString *)query
{
  NSURLComponents *components = [NSURLComponents componentsWithURL:serverRootWithHost(packagerHost) resolvingAgainstBaseURL:NO];
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
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI29_0_0RCTEnableDevKey];
}

- (BOOL)enableLiveReload
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI29_0_0RCTEnableLiveReloadKey];
}

- (BOOL)enableMinification
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:kABI29_0_0RCTEnableMinificationKey];
}

- (NSString *)jsLocation
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kABI29_0_0RCTJsLocationKey];
}

- (void)setEnableDev:(BOOL)enableDev
{
  [self updateValue:@(enableDev) forKey:kABI29_0_0RCTEnableDevKey];
}

- (void)setEnableLiveReload:(BOOL)enableLiveReload
{
  [self updateValue:@(enableLiveReload) forKey:kABI29_0_0RCTEnableLiveReloadKey];
}

- (void)setJsLocation:(NSString *)jsLocation
{
  [self updateValue:jsLocation forKey:kABI29_0_0RCTJsLocationKey];
}

- (void)setEnableMinification:(BOOL)enableMinification
{
  [self updateValue:@(enableMinification) forKey:kABI29_0_0RCTEnableMinificationKey];
}

+ (instancetype)sharedSettings
{
  static ABI29_0_0RCTBundleURLProvider *sharedInstance;
  static dispatch_once_t once_token;
  dispatch_once(&once_token, ^{
    sharedInstance = [ABI29_0_0RCTBundleURLProvider new];
  });
  return sharedInstance;
}

@end
