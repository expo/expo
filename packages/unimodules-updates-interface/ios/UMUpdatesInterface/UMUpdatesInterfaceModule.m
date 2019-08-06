// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMUpdatesInterface/UMUpdatesInterfaceModule.h>

@interface UMUpdatesInterfaceModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation UMUpdatesInterfaceModule

EX_EXPORT_MODULE(UnimodulesUpdatesInterface);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
}

@end
