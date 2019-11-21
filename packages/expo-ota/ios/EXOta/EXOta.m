//
//  EXOta.m
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import "EXOta.h"
#import "EXOtaPersistanceFactory.h"
#import "EXOtaPersistance.h"
#import "EXOtaUpdaterFactory.h"
#import "EXExpoUpdatesConfig.h"

@implementation EXOta

EXOtaUpdater *updater;
EXOtaPersistance *persistance;

- (id)init
{
  EXExpoUpdatesConfig *config = [[EXExpoUpdatesConfig alloc] initWithEmbeddedManifest];
  return [self initWithConfig:config];
}

-(id)initWithConfig:(id<EXOtaConfig>)config;
{
  return [self initWithId:@"defaultId" withConfig:config];
}

-(id)initWithId:(NSString *)appId withConfig:(id<EXOtaConfig>)config;
{
  persistance = [[EXOtaPersistanceFactory sharedFactory] persistanceForId:appId createIfNeeded:YES];
  persistance.config = config;
  persistance.appId = appId;
  updater =[[EXOtaUpdaterFactory sharedFactory] updaterForId:appId initWithConfig:config withPersistance:persistance];
  if(config.checkForUpdatesAutomatically)
  {
    [self start];
  }
  return self;
}

- (void)start
{
  [updater removeOutdatedBundle];
  [updater checkAndDownloadUpdate:^(NSDictionary * _Nonnull manifest, NSString * _Nonnull filePath) {
    [updater saveDownloadedManifest:manifest andBundlePath:filePath];
    [updater scheduleForExchangeAtNextBoot];
  } updateUnavailable:^{} error:^(NSError * _Nonnull error) {
    NSLog(@"EXOta: error while fetching update! %@ %@", error, [error userInfo]);
  }];
}

- (NSString *) bundlePath
{
  return [persistance readBundlePath];
}

@end
