// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

@interface EXInAppPurchasesModule ()

@property (weak, nonatomic) UMModuleRegistry *moduleRegistry;
@property(nonatomic, assign) BOOL queryingItems;
@property (strong, nonatomic) NSMutableDictionary *promises;
@property (strong, nonatomic) SKProductsRequest *request;
@property (strong, nonatomic) SKReceiptRefreshRequest *receiptRequest;
@property (strong, nonatomic) NSArray<SKProduct*> *products;

@end

static NSString const * QUERY_HISTORY_KEY = @"QUERY_HISTORY";
static NSString const * QUERY_PURCHASABLE_KEY = @"QUERY_PURCHASABLE";

static const int SERVICE_DISCONNECTED = -1;
static const int OK = 0;
static const int ERROR = 1;
static const int USER_CANCELED = 2;

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
         @"OK": @(OK),
         @"USER_CANCELED": @(USER_CANCELED),
         @"ERROR": @(ERROR),
         @"SERVICE_DISCONNECTED": @(SERVICE_DISCONNECTED),
      },
      @"purchaseStates": @{
         @"PURCHASED": @(SKPaymentTransactionStatePurchased),
         @"PENDING": @(SKPaymentTransactionStatePurchasing),
         @"FAILED": @(SKPaymentTransactionStateFailed),
         @"RESTORED": @(SKPaymentTransactionStateRestored),
         @"DEFERRED": @(SKPaymentTransactionStateDeferred),
      }
   };
}

UM_EXPORT_METHOD_AS(connectToAppStoreAsync,
                    connectToAppStoreAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling ConnectToAppStoreAsync");
  // Initialize listener and promises dictionary
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  _promises = [NSMutableDictionary dictionary];
  _queryingItems = NO;
  [self setPromise:QUERY_HISTORY_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

UM_EXPORT_METHOD_AS(queryPurchasableItemsAsync,
                    queryPurchasableItemsAsync:(NSArray *)productIDs
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [self setPromise:QUERY_PURCHASABLE_KEY resolve:resolve reject:reject];

  _queryingItems = YES;
  [self requestProducts:productIDs];
}

UM_EXPORT_METHOD_AS(purchaseItemAsync,
                    purchaseItemAsync:(NSString *)productIdentifier
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if ([SKPaymentQueue canMakePayments]) {
    NSArray *productArray = [NSArray arrayWithObjects:productIdentifier,nil];
    [self setPromise:productIdentifier resolve:resolve reject:reject];

    _queryingItems = NO;
    [self requestProducts:productArray];
  } else {
    reject(@"E_MISSING_PERMISSIONS", @"User cannot make payments", nil);
  }
}

UM_EXPORT_METHOD_AS(queryPurchaseHistoryAsync,
                    queryPurchaseHistoryAsync:(NSArray *)productIDs
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableHistoryAsync!");
  [self setPromise:QUERY_HISTORY_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

UM_EXPORT_METHOD_AS(disconnectAsync,
                    disconnectAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling disconnectAsync!");
  [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
  resolve(nil);
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{

  for (NSString *invalidIdentifier in response.invalidProductIdentifiers) {
    NSLog(@"Invalid identifier: %@", invalidIdentifier);
    // TODO: Reject promise?
    [self resolvePromise:invalidIdentifier value:nil];
  }
  NSInteger count = response.products.count;
  if (count == 0) {
    NSLog(@"No products available");
  }
  _products = response.products;
  NSMutableArray *result = [NSMutableArray array];

  for (SKProduct *validProduct in response.products) {
    if (_queryingItems) {
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

  _queryingItems = NO;
  NSDictionary *res = [self formatResults:result withResponseCode:OK];
  [self resolvePromise:QUERY_PURCHASABLE_KEY value:res];
}

-(void)setPromise:(NSString*)key resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  NSArray *promise = _promises[key];

  if (promise == nil) {
    _promises[key] = @[resolve, reject];
  } else {
    reject(@"E_UNFINISHED_PROMISE", @"Must wait for promise to resolve before recalling function.", nil);
  }
}

-(void)resolvePromise:(NSString*)key value:(id)value
{
  NSArray *currentPromise = _promises[key];

  if (currentPromise != nil) {
    UMPromiseResolveBlock resolve = currentPromise[0];
    _promises[key] = nil;

    resolve(value);
  }
}

-(void)rejectPromise:(NSString*)key code:(NSString*)code message:(NSString*)message error:(NSError*) error
{
  NSArray* currentPromise = _promises[key];

  if (currentPromise != nil) {
    UMPromiseRejectBlock reject = currentPromise[1];
    _promises[key] = nil;

    reject(code, message, error);
  }
}

- (void)purchase:(SKProduct *)product
{
  SKPayment *payment = [SKPayment paymentWithProduct:product];
  [[SKPaymentQueue defaultQueue] addPayment:payment];
}

- (void)paymentQueueRestoreCompletedTransactionsFinished:(SKPaymentQueue *)queue
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
  [self resolvePromise:QUERY_HISTORY_KEY value:response];
}

- (NSDictionary *)getProductData:(SKProduct *)product
{
  // Format item type sub period and priceAmountMicros for platform consistency
  NSString *type = @"inapp";
  NSString *subscriptionPeriod;
  if (@available(iOS 11.2, *)) {
    if (product.subscriptionPeriod != nil) {
      subscriptionPeriod = [self getSubscriptionPeriod:product];
      // Use with caution: P0D also implies non-renewable subscription.
      if (![subscriptionPeriod isEqualToString:@"P0D"]) {
        type = @"subs";
      }
    }
  }

  NSDecimalNumber *oneMillion = [[NSDecimalNumber alloc] initWithInt:1000000];
  NSDecimalNumber *priceAmountMicros = [product.price decimalNumberByMultiplyingBy:oneMillion];

  // Format price string
  NSMutableString *price = [NSMutableString string];
  NSString *priceString = [NSString stringWithFormat:@"%@", product.price];
  [price appendString:product.priceLocale.currencySymbol];
  [price appendString:priceString];

  return @{
          @"description": product.localizedDescription,
          @"price": price,
          @"priceAmountMicros": priceAmountMicros,
          @"priceCurrencyCode": product.priceLocale.currencyCode,
          @"productId": product.productIdentifier,
          @"subscriptionPeriod": subscriptionPeriod,
          @"title": product.localizedTitle,
          @"type": type
          };
}

- (NSDictionary *)getTransactionData:(SKPaymentTransaction *)transaction
{
  NSData *receiptData = [NSData dataWithContentsOfURL:[[NSBundle mainBundle] appStoreReceiptURL]];
  return @{
          @"acknowledged": @YES,
          @"orderId": transaction.transactionIdentifier,
          @"productId": transaction.payment.productIdentifier,
          @"purchaseState": @(transaction.transactionState),
          @"purchaseTime": @(transaction.transactionDate.timeIntervalSince1970 * 1000),
          @"transactionReceipt": [receiptData base64EncodedStringWithOptions:0]
          };
}

- (NSString *)getSubscriptionPeriod:(SKProduct *)product
{
  NSMutableString *subscriptionPeriod = [[NSMutableString alloc] init];
  [subscriptionPeriod appendString:@""];

  // Subscription period specified in ISO 8601 format to match Android implementation (e.g. P3M = 3 months)
  if (@available(iOS 11.2, *)) {
    [subscriptionPeriod appendString:@"P"];
    NSUInteger numUnits = product.subscriptionPeriod.numberOfUnits;
    [subscriptionPeriod appendString: [NSString stringWithFormat:@"%lu", (unsigned long)numUnits]];
    NSString *unit;
    switch(product.subscriptionPeriod.unit) {
      case SKProductPeriodUnitDay: {
        unit = @"D";
        break;
      }
      case SKProductPeriodUnitWeek: {
        unit = @"W";
        break;
      }
      case SKProductPeriodUnitMonth: {
        unit = @"M";
        break;
      }
      case SKProductPeriodUnitYear: {
        unit = @"Y";
        break;
      }
    }
    [subscriptionPeriod appendString:unit];
  }

  return subscriptionPeriod;
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions
{
  for (SKPaymentTransaction *transaction in transactions) {

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
        [[SKPaymentQueue defaultQueue] finishTransaction:transaction];
        if(transaction.error.code == SKErrorPaymentCancelled){
          NSLog(@"Transaction state -> Cancelled");
          NSDictionary *response = [self formatResults:[NSArray array] withResponseCode:USER_CANCELED];
          [self resolvePromise:transaction.payment.productIdentifier value:response];
        } else {
          NSString *errorCode = [NSString stringWithFormat:@"%ld", (long)transaction.error.code];
          [self rejectPromise:transaction.payment.productIdentifier code:errorCode message:transaction.error.localizedDescription error:transaction.error];
        }
        break;
      }
    }
  }
}

-(NSDictionary *)formatResults:(NSArray *)results withResponseCode:(NSInteger)responseCode
{
  return @{
           @"results": results,
           @"responseCode": @(responseCode),
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
