// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXSystemNavigationBar/EXSystemNavigationBarModule.h>

@interface EXSystemNavigationBarModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXSystemNavigationBarModule

UM_EXPORT_MODULE(ExpoSystemNavigationBar);

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
