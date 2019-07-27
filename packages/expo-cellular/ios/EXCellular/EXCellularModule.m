// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXCellular/EXCellularModule.h>

@interface EXCellularModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXCellularModule

UM_EXPORT_MODULE(ExpoCellular);

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
