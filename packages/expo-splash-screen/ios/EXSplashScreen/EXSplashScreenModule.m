// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXSplashScreen/EXSplashScreenModule.h>

@interface EXSplashScreenModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXSplashScreenModule

UM_EXPORT_MODULE(ExpoSplashScreen);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
}

@end
