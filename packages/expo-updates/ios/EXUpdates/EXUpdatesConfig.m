//  Copyright © 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesConfig.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUpdatesConfig ()

@property (nonatomic, readwrite, strong) NSURL *remoteUrl;
@property (nonatomic, readwrite, strong) NSString *releaseChannel;

@end

static NSString * const kEXUpdatesConfigPlistName = @"expo-updates";
static NSString * const kEXUpdatesDefaultReleaseChannelName = @"default";

@implementation EXUpdatesConfig

+ (instancetype)sharedInstance
{
  static EXUpdatesConfig *theConfig;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theConfig) {
      theConfig = [[EXUpdatesConfig alloc] init];
    }
  });
  return theConfig;
}

- (instancetype)init
{
  if (self = [super init]) {
    [self _loadConfig];
  }
  return self;
}

- (void)_loadConfig
{
  NSString *configPath = [[NSBundle mainBundle] pathForResource:kEXUpdatesConfigPlistName ofType:@"plist"];
  NSDictionary *config = (configPath) ? [NSDictionary dictionaryWithContentsOfFile:configPath] : @{};

  id remoteUrl = config[@"remoteUrl"];
  NSAssert(remoteUrl && [remoteUrl isKindOfClass:[NSString class]], @"remoteUrl must be a nonnull string");
  NSURL *url = [NSURL URLWithString:(NSString *)remoteUrl];
  NSAssert(url, @"remoteUrl must be a valid URL");
  _remoteUrl = url;

  id releaseChannel = config[@"releaseChannel"];
  if (releaseChannel && [releaseChannel isKindOfClass:[NSString class]]) {
    _releaseChannel = (NSString *)releaseChannel;
  } else {
    _releaseChannel = kEXUpdatesDefaultReleaseChannelName;
  }
}

@end

NS_ASSUME_NONNULL_END
