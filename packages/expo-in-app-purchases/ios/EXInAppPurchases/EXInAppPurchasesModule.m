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

- (NSDictionary *)constantsToExport
{
  return @{
     @"responseCodes": [[NSDictionary alloc] initWithObjectsAndKeys:@"OK", 0, @"USER_CANCELED", 1, nil],
     @"purchaseStates": [[NSDictionary alloc] initWithObjectsAndKeys:@"PURCHASED", 1, @"PENDING", 2, nil],
   };
}

UM_EXPORT_METHOD_AS(connectToAppStoreAsync,
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Connecting to iOS app store!");
  NSMutableArray *results = [[NSMutableArray alloc] initWithObjects:@"{}", nil];
  NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithObjectsAndKeys:@0, @"responseCode", results, @"results", nil];

  resolve(response);
}

@end
