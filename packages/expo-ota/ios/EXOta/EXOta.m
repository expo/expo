//
//  EXOta.m
//  EXOta
//
//  Created by Michał Czernek on 19/09/2019.
//

#import "EXOta.h"
#import "EXOtaPersistanceFactory.h"
#import "EXOtaPersistance.h"
#import "EXOtaUpdater.h"

@implementation EXOta

EXOtaUpdater *updater;
EXOtaPersistance *persistance;

-(void)start
{
    [updater removeOutdatedBundle];
    [updater checkAndDownloadUpdate:^(NSDictionary * _Nonnull manifest, NSString * _Nonnull filePath) {
        [updater saveDownloadedManifest:manifest andBundlePath:filePath];
        [updater scheduleForExchangeAtNextBoot];
    } updateUnavailable:^{} error:^(NSError * _Nonnull error) {
        NSLog(@"EXOta: error while fetching update! %@ %@", error, [error userInfo]);
    }];
}

- (NSString*) bundlePath
{
    return [persistance readBundlePath];
}

-(id)initWithConfig:(id<EXOtaConfig>)config;
{
    return [self initWithId:@"defaultId" withConfig:config];
}

-(id)initWithId:(NSString*)appId withConfig:(id<EXOtaConfig>)config;
{
    persistance = [[EXOtaPersistanceFactory sharedFactory] persistanceForId:appId];
    persistance.config = config;
    persistance.appId = appId;
    updater =[[EXOtaUpdater alloc] initWithConfig:config withPersistance:persistance withId:appId];
    return self;
}

@end
