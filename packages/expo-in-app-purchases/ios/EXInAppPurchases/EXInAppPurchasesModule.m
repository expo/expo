// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

#define QUERY_KEY @"queryPurchasableItems"

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
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  promises = [NSMutableDictionary dictionary];
  //[[SKPaymentQueue defaultQueue] restoreCompletedTransactions];

  NSMutableArray *results = [[NSMutableArray alloc] initWithObjects:@"{}", nil];
  NSMutableDictionary *response = [[NSMutableDictionary alloc] initWithObjectsAndKeys:@0, @"responseCode", results, @"results", nil];

  resolve(response);
}

UM_EXPORT_METHOD_AS(queryPurchasableItemsAsync,
                    queryPurchasableItemsAsync:(NSArray *)productIDs
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableItemsAsync!");

  [self setPromise:QUERY_KEY resolve:resolve reject:reject];

  [self requestProducts:productIDs];
}

UM_EXPORT_METHOD_AS(purchaseItemAsync,
                    purchaseItemAsync:(NSString *)productIdentifier
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject) {
  NSLog(@"Calling purchaseItemAsync!");

  if([SKPaymentQueue canMakePayments]){
    NSLog(@"User can make payments");

    SKProductsRequest *productsRequest = [[SKProductsRequest alloc] initWithProductIdentifiers:[NSSet setWithObject:productIdentifier]];
    productsRequest.delegate = self;

    [self setPromise:productIdentifier resolve:resolve reject:reject];
    [productsRequest start];
  }
  else{
    NSLog(@"User cannot make purchases");
  }
}

UM_EXPORT_METHOD_AS(disconnectAsync,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject) {
  NSLog(@"Calling disconnectAsync!");
  [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
  resolve(nil);
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response{

  for (NSString *invalidIdentifier in response.invalidProductIdentifiers) {
    NSLog(@"Invalid identifier: %@", invalidIdentifier);
    // TODO: Reject promise?
    [self resolvePromise: invalidIdentifier value:nil];
  }
  NSInteger count = [response.products count];
  if(count == 0){
    NSLog(@"No products available");
  }
  self.products = response.products;
  for (SKProduct *validProduct in response.products) {
    NSLog(@"Purchasing %@", validProduct.productIdentifier);
    [self purchase:validProduct];
    [self resolvePromise:validProduct.productIdentifier value: validProduct];
  }

  [self resolvePromise:QUERY_KEY value:response.products];
}

-(void)setPromise:(NSString*)key resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject {
  NSMutableArray* promise = [promises valueForKey:key];

  if (promise == nil) {
    promise = [NSMutableArray array];
    [promises setValue:promise forKey:key];
  }

  [promise addObject:@[resolve, reject]];
}

-(void)resolvePromise:(NSString*)key value:(id)value {
  NSMutableArray* currentPromise = [promises valueForKey:key];

  if (currentPromise != nil) {
    for (NSMutableArray *tuple in currentPromise) {
      UMPromiseResolveBlock resolve = tuple[0];
      resolve(value);
    }
    [promises removeObjectForKey:key];
  }
}

-(void)rejectPromise:(NSString*)key code:(NSString*)code message:(NSString*)message error:(NSError*) error {
  NSMutableArray* currentPromise = [promises valueForKey:key];

  if (currentPromise != nil) {
    for (NSMutableArray *tuple in currentPromise) {
      UMPromiseRejectBlock reject = tuple[1];
      reject(code, message, error);
    }
    [promises removeObjectForKey:key];
  }
}

- (void)purchase:(SKProduct *)product{
  SKPayment *payment = [SKPayment paymentWithProduct:product];
  [[SKPaymentQueue defaultQueue] addPayment:payment];
}

- (void) restore {
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

- (void) paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue
{
  NSLog(@"received restored transactions: %lu", queue.transactions.count);
  for(SKPaymentTransaction *transaction in queue.transactions){
    if(transaction.transactionState == SKPaymentTransactionStateRestored){
      //called when the user successfully restores a purchase
      NSLog(@"Transaction state -> Restored");

      NSLog(@"Restoring transaction %@", transaction.payment.productIdentifier);
      [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
      break;
    }
  }
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions{
  for(SKPaymentTransaction *transaction in transactions){

    switch(transaction.transactionState){
      case SKPaymentTransactionStatePurchasing:
        NSLog(@"Transaction state -> Purchasing");
        break;
      case SKPaymentTransactionStatePurchased:
        NSLog(@"Made a purchase!");
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        NSLog(@"Transaction state -> Purchased");
        break;
      case SKPaymentTransactionStateRestored:
        NSLog(@"Transaction state -> Restored");
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
      case SKPaymentTransactionStateDeferred:
        break;
      case SKPaymentTransactionStateFailed:
        if(transaction.error.code == SKErrorPaymentCancelled){
          NSLog(@"Transaction state -> Cancelled");
        }
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
    }
  }
}

- (void)requestProducts:(NSArray *)productIdentifiers
{

  SKProductsRequest *productsRequest = [[SKProductsRequest alloc]
                                        initWithProductIdentifiers:[NSSet setWithArray:productIdentifiers]];
  // Keep a strong reference to the request.
  self.request = productsRequest;
  productsRequest.delegate = self;

  [productsRequest start];
}

@end
