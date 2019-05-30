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
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
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
  self->resolve = resolve;
  self->reject = reject;

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
    self->resolve = resolve;
    self->reject = reject;
    [productsRequest start];
  }
  else{
    NSLog(@"User cannot make purchases");
  }
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response{

  for (NSString *invalidIdentifier in response.invalidProductIdentifiers) {
    NSLog(@"Invalid identifier: %@", invalidIdentifier);
  }
  NSInteger count = [response.products count];
  if(count == 0){
    NSLog(@"No products available");
  }
  self.products = response.products;
  for (SKProduct *validProduct in response.products) {
    NSLog(@"Purchasing %@", validProduct.productIdentifier);
    [self purchase:validProduct];
  }

  self->resolve(response.products);
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
        //self->resolve(@0);
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
        //self->resolve(@1);
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
