// Copyright 2019 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesAppController.h>
#import <EXUpdates/EXUpdatesAppLauncher.h>
#import <EXUpdates/EXUpdatesDatabase.h>
#import <EXUpdates/EXUpdatesModule.h>

@interface EXUpdatesModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXUpdatesModule

UM_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  return @{
           @"assets": [controller.database assetsForUpdateId:[controller.launcher launchedUpdateId]]
           };
}

UM_EXPORT_METHOD_AS(getAssetsAsync,
                    getAssetsAsync:(UMPromiseResolveBlock)resolve
                            reject:(UMPromiseRejectBlock)reject)
{
  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
  resolve([controller.database assetsForUpdateId:[controller.launcher launchedUpdateId]]);
}

@end
