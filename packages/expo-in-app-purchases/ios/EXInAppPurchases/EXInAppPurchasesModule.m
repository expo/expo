// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

#define CONNECT_KEY @"connectToAppStoreAsync"
#define QUERY_KEY @"queryPurchasableItemsAsync"
#define SERVICE_DISCONNECTED -1
#define OK 0
#define USER_CANCELLED 1
#define ERROR 2

@implementation EXInAppPurchasesModule

UM_EXPORT_MODULE(ExpoInAppPurchases);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

- (NSDictionary *)constantsToExport
{
  return @{
       @"responseCodes": @{
         @"OK": @OK,
         @"USER_CANCELLED": @USER_CANCELLED,
         @"ERROR": @ERROR,
         @"SERVICE_DISCONNECTED": @SERVICE_DISCONNECTED
      },
      @"purchaseStates": @{
         @"PURCHASED": [NSNumber numberWithInteger:SKPaymentTransactionStatePurchased],
         @"PENDING": [NSNumber numberWithInteger:SKPaymentTransactionStatePurchasing],
         @"FAILED": [NSNumber numberWithInteger:SKPaymentTransactionStateFailed],
         @"RESTORED": [NSNumber numberWithInteger:SKPaymentTransactionStateRestored],
         @"DEFERRED": [NSNumber numberWithInteger:SKPaymentTransactionStateDeferred]
      }
   };
}

UM_EXPORT_METHOD_AS(connectToAppStoreAsync,
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Connecting to iOS app store!");
  // Initialize listener and promises dictionary
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  promises = [NSMutableDictionary dictionary];
  queryingItems = NO;
  [self setPromise:CONNECT_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

UM_EXPORT_METHOD_AS(queryPurchasableItemsAsync,
                    queryPurchasableItemsAsync:(NSArray *)productIDs
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableItemsAsync!");

  [self setPromise:QUERY_KEY resolve:resolve reject:reject];

  self->queryingItems = YES;
  [self requestProducts:productIDs];
}

UM_EXPORT_METHOD_AS(purchaseItemAsync,
                    purchaseItemAsync:(NSString *)productIdentifier
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject) {
  NSLog(@"Calling purchaseItemAsync!");

  if([SKPaymentQueue canMakePayments]){
    NSLog(@"User can make payments");

    NSArray *productArray = [NSArray arrayWithObjects:productIdentifier,nil];
    [self setPromise:productIdentifier resolve:resolve reject:reject];

    self->queryingItems = NO;
    [self requestProducts:productArray];
  }
  else{
    NSLog(@"User cannot make purchases");
  }
}

UM_EXPORT_METHOD_AS(queryPurchaseHistoryAsync,
                    queryPurchaseHistoryAsync:(NSArray *)productIDs
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableHistoryAsync!");
  [self setPromise:CONNECT_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
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
  NSMutableArray *result = [NSMutableArray array];

  for (SKProduct *validProduct in response.products) {
    if(self->queryingItems) {
      // Calling queryPurchasableItemsAsync
      NSLog(@"Querying items. Getting data for %@", validProduct.productIdentifier);
      NSDictionary *productData = [self getProductData:validProduct];
      [result addObject:productData];
    } else {
      // Making a purchase
      NSLog(@"Purchasing %@", validProduct.productIdentifier);
      [self purchase:validProduct];
    }
  }

  self->queryingItems = NO;
  NSDictionary *res = [self formatResults:result withResponseCode:OK];
  [self resolvePromise:QUERY_KEY value:res];
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

- (void) paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue
{
  NSLog(@"received restored transactions: %lu", queue.transactions.count);
  NSMutableArray *results = [NSMutableArray array];

  for(SKPaymentTransaction *transaction in queue.transactions) {
    SKPaymentTransactionState transactionState = transaction.transactionState;
    NSLog(@"%ld", transactionState);
    if(transactionState == SKPaymentTransactionStateRestored || transactionState == SKPaymentTransactionStatePurchased){
      NSLog(@"Transaction state -> Restored or Purchased");

      NSDictionary * transactionData = [self getTransactionData:transaction];
      [results addObject:transactionData];

      NSLog(@"Restoring transaction %@", transaction.payment.productIdentifier);
      [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
    }
  }

  NSDictionary *response = [self formatResults:results withResponseCode:OK];
  [self resolvePromise:CONNECT_KEY value:response];
}

- (NSDictionary *)getProductData: (SKProduct *) product {
  // Format item type and price_amount_micros for platform consistency
  NSString * type = product.subscriptionPeriod.numberOfUnits == nil ? @"inapp" : @"subs";
  NSDecimalNumber *oneMillion = [[NSDecimalNumber alloc] initWithInt:1000000];
  NSDecimalNumber *priceAmountMicros = [product.price decimalNumberByMultiplyingBy:oneMillion];

  // Format price string
  NSMutableString *price = [NSMutableString string];
  NSString *priceString = [NSString stringWithFormat:@"%@", product.price];
  [price appendString:product.priceLocale.currencySymbol];
  [price appendString:priceString];

  NSDictionary *productData = @{
                                @"description": product.localizedDescription,
                                @"price": price,
                                @"price_amount_micros": priceAmountMicros,
                                @"price_currency_code": product.priceLocale.currencyCode,
                                @"productId": product.productIdentifier,
                                @"skuDetailsToken": [NSNull null],
                                @"title": product.localizedTitle,
                                @"type": type
                                };
  return productData;
}

- (NSDictionary *)getTransactionData: (SKPaymentTransaction *) transaction {
  NSData *receiptData = [NSData dataWithContentsOfURL:[[NSBundle mainBundle] appStoreReceiptURL]];
  NSDictionary *transactionData = @{
                                    @"acknowledged": @YES,
                                    @"orderId": transaction.transactionIdentifier,
                                    @"productId": transaction.payment.productIdentifier,
                                    @"purchaseState": @(transaction.transactionState),
                                    @"purchaseTime": @(transaction.transactionDate.timeIntervalSince1970 * 1000),
                                    @"transactionReceipt": [receiptData base64EncodedStringWithOptions:0]
                                    };
  return transactionData;
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions{
  for(SKPaymentTransaction *transaction in transactions){

    switch(transaction.transactionState) {
      case SKPaymentTransactionStatePurchasing: {
        NSLog(@"Transaction state -> Purchasing");
        break;
      }
      case SKPaymentTransactionStatePurchased: {
        NSLog(@"Made a purchase!");
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        NSLog(@"Transaction state -> Purchased");
        NSArray *results = [NSArray arrayWithObjects: [self getTransactionData:transaction], nil];
        NSDictionary *response = [self formatResults:results withResponseCode:OK];
        [self resolvePromise:transaction.payment.productIdentifier value:response];
        break;
      }
      case SKPaymentTransactionStateRestored: {
        NSLog(@"Transaction state -> Restored");
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        break;
      }
      case SKPaymentTransactionStateDeferred: {
        break;
      }
      case SKPaymentTransactionStateFailed: {
        if(transaction.error.code == SKErrorPaymentCancelled){
          NSLog(@"Transaction state -> Cancelled");
        }
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        NSDictionary *response = [self formatResults:[NSArray array] withResponseCode:transaction.error.code];
        [self resolvePromise:transaction.payment.productIdentifier value:response];
        break;
      }
    }
  }
}

-(NSDictionary *) formatResults:(NSArray *)results withResponseCode:(NSInteger)responseCode {
  return @{
           @"results": results,
           @"responseCode": [NSNumber numberWithInteger:responseCode],
           };
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
