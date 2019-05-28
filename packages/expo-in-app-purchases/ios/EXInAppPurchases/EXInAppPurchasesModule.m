// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

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
  //[[SKPaymentQueue defaultQueue] restoreCompletedTransactions];

  NSMutableArray *results = [[NSMutableArray alloc] initWithObjects:@"{}", nil];
  NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithObjectsAndKeys:@0, @"responseCode", results, @"results", nil];

  resolve(response);
}

UM_EXPORT_METHOD_AS(queryPurchasableItemsAsync,
                    queryPurchasableItemsAsync:(NSArray *)productIdentifiers
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableItemsAsync!");
  [self validateProductIdentifiers:productIdentifiers resolve:resolve];
}

- (void)validateProductIdentifiers:(NSArray *)productIdentifiers resolve: (UMPromiseResolveBlock)resolve
{

  SKProductsRequest *productsRequest = [[SKProductsRequest alloc]
                                        initWithProductIdentifiers:[NSSet setWithArray:productIdentifiers]];

  // Keep a strong reference to the request.
  self.request = productsRequest;
  productsRequest.delegate = self;
  self->resolve = resolve;

  [productsRequest start];
}

- (void)productsRequest:(SKProductsRequest *)request
     didReceiveResponse:(SKProductsResponse *)response
{

  self.products = response.products;

  for (NSString *invalidIdentifier in response.invalidProductIdentifiers) {
    NSLog(@"Invalid identifier:");
    NSLog(@"%@", invalidIdentifier);
    // Handle any invalid product identifiers.
  }

  self->resolve(self.products);
}

@end
