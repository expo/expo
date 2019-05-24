// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

@interface EXInAppPurchasesModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXInAppPurchasesModule

UM_EXPORT_MODULE(ExpoInAppPurchases);

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
