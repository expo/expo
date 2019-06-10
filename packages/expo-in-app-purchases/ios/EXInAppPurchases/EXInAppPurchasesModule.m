// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXInAppPurchases/EXInAppPurchasesModule.h>

@interface EXInAppPurchasesModule ()

@property (weak, nonatomic) UMModuleRegistry *moduleRegistry;
@property (nonatomic, assign) BOOL queryingItems;
@property (strong, nonatomic) NSMutableDictionary *promises;
@property (strong, nonatomic) NSMutableSet *retrievedItems;
@property (strong, nonatomic) SKProductsRequest *request;
@property (strong, nonatomic) SKReceiptRefreshRequest *receiptRequest;
@property (strong, nonatomic) NSArray<SKProduct*> *products;

@end

static NSString * const QUERY_HISTORY_KEY = @"QUERY_HISTORY";
static NSString * const QUERY_PURCHASABLE_KEY = @"QUERY_PURCHASABLE";
static NSString * const IN_APP = @"inapp";
static NSString * const SUBS = @"subs";
static NSString * const P0D = @"P0D";

static const int OK = 0;
static const int USER_CANCELED = 1;
static const int ERROR = 2;

@implementation EXInAppPurchasesModule

UM_EXPORT_MODULE(ExpoInAppPurchases);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(connectAsync,
                    connectAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling ConnectToAppStoreAsync");
  // Initialize listener and promises dictionary
  [[SKPaymentQueue defaultQueue] addTransactionObserver:self];
  _promises = [NSMutableDictionary dictionary];
  _retrievedItems = [NSMutableSet set];
  _queryingItems = NO;
  [self setPromise:QUERY_HISTORY_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

UM_EXPORT_METHOD_AS(getProductsAsync,
                    getProductsAsync:(NSArray *)productIDs
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [self setPromise:QUERY_PURCHASABLE_KEY resolve:resolve reject:reject];

  for (NSString *identifier in productIDs) {
    [_retrievedItems addObject:identifier];
  }
  _queryingItems = YES;
  [self requestProducts:productIDs];
}

UM_EXPORT_METHOD_AS(purchaseItemAsync,
                    purchaseItemAsync:(NSString *)productIdentifier
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  if (![SKPaymentQueue canMakePayments]) {
    reject(@"E_MISSING_PERMISSIONS", @"User cannot make payments", nil);
    return;
  }
  if (![_retrievedItems containsObject:productIdentifier]) {
    reject(@"E_ITEM_NOT_QUERIED", @"Must query item from store before calling purchase", nil);
    return;
  }

  // Make the request
  NSArray *productArray = @[productIdentifier];
  [self setPromise:productIdentifier resolve:resolve reject:reject];
  _queryingItems = NO;
  [self requestProducts:productArray];
}

UM_EXPORT_METHOD_AS(getPurchaseHistoryAsync,
                    getPurchaseHistoryAsync:(BOOL)refresh
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling queryPurchasableHistoryAsync");
  [self setPromise:QUERY_HISTORY_KEY resolve:resolve reject:reject];

  // Request history
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}

UM_EXPORT_METHOD_AS(disconnectAsync,
                    disconnectAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  NSLog(@"Calling disconnectAsync");
  [[SKPaymentQueue defaultQueue] removeTransactionObserver:self];
  resolve(nil);
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{

  for (NSString *invalidIdentifier in response.invalidProductIdentifiers) {
    if (!_queryingItems) {
      NSDictionary *results = [self formatResults:SKErrorStoreProductNotAvailable];
      [self resolvePromise:invalidIdentifier value:results];
    }
  }
  NSInteger count = response.products.count;
  if (count == 0) {
    NSLog(@"No products available");
  }
  _products = response.products;
  NSMutableArray *result = [NSMutableArray array];

  for (SKProduct *validProduct in response.products) {
    if (_queryingItems) {
      // Retrieving product info
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

- (void)setPromise:(NSString*)key resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject
{
  NSArray *promise = _promises[key];

  if (promise == nil) {
    _promises[key] = @[resolve, reject];
  } else {
    reject(@"E_UNFINISHED_PROMISE", @"Must wait for promise to resolve before recalling function.", nil);
  }
}

- (void)resolvePromise:(NSString*)key value:(id)value
{
  NSArray *currentPromise = _promises[key];

  if (currentPromise != nil) {
    UMPromiseResolveBlock resolve = currentPromise[0];
    _promises[key] = nil;

    resolve(value);
  }
}

- (void)rejectPromise:(NSString*)key code:(NSString*)code message:(NSString*)message error:(NSError*) error
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
  NSMutableArray *results = [NSMutableArray array];

  for (SKPaymentTransaction *transaction in queue.transactions) {
    SKPaymentTransactionState transactionState = transaction.transactionState;
    if (transactionState == SKPaymentTransactionStateRestored || transactionState == SKPaymentTransactionStatePurchased) {
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

- (void)paymentQueue:(SKPaymentQueue *)queue restoreCompletedTransactionsFailedWithError:(NSError *)error {
  int errorCode = [self errorCodeNativeToJS:error.code];
  NSDictionary *response = [self formatResults:errorCode];
  [self resolvePromise:QUERY_HISTORY_KEY value:response];
}

- (NSDictionary *)getProductData:(SKProduct *)product
{
  // Use with caution: P0D also implies non-renewable subscription.
  NSString *subscriptionPeriod = [self getSubscriptionPeriod:product];
  NSString *type = [subscriptionPeriod isEqualToString:P0D] ? IN_APP : SUBS;

  NSDecimalNumber *oneMillion = [[NSDecimalNumber alloc] initWithInt:1000000];
  NSDecimalNumber *priceAmountMicros = [product.price decimalNumberByMultiplyingBy:oneMillion];
  NSString *price = [NSString stringWithFormat:@"%@%@", product.priceLocale.currencySymbol, product.price];

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
  // Subscription period specified in ISO 8601 format to match Android implementation (e.g. P3M = 3 months)
  if (@available(iOS 11.2, *)) {
    NSString *unit = [self getUnit:product];
    unsigned long numUnits = (unsigned long)product.subscriptionPeriod.numberOfUnits;
    return [NSString stringWithFormat:@"P%lu%@", numUnits, unit];
  }

  // Default to P0D if we can't get this info so we assume all products are in app
  return P0D;
}

- (NSString *)getUnit:(SKProduct *)product
{
  if (@available(iOS 11.2, *)) {
    switch(product.subscriptionPeriod.unit) {
      case SKProductPeriodUnitDay: {
        return @"D";
      }
      case SKProductPeriodUnitWeek: {
        return @"W";
      }
      case SKProductPeriodUnitMonth: {
        return @"M";
      }
      case SKProductPeriodUnitYear: {
        return @"Y";
      }
    }
  }
  return [NSString string];
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
        NSArray *results = @[[self getTransactionData:transaction]];
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
          NSDictionary *response = [self formatResults:transaction.error.code];
          [self resolvePromise:transaction.payment.productIdentifier value:response];
        }
        break;
      }
    }
  }
}

- (NSDictionary *)formatResults:(NSArray *)results withResponseCode:(NSInteger)responseCode
{
  return @{
           @"results": results,
           @"responseCode": @(responseCode),
           };
}

- (NSDictionary *)formatResults:(SKErrorCode)errorCode
{
  int convertedErrorCode = [self errorCodeNativeToJS:errorCode];
  return @{
           @"results": [NSArray array],
           @"responseCode": @(ERROR),
           @"errorCode": @(convertedErrorCode),
           };
}

// Convert native error code to match TS enum
- (int)errorCodeNativeToJS:(SKErrorCode)errorCode
{
  switch(errorCode) {
    case SKErrorUnknown:
      return 0;
    case SKErrorClientInvalid:
    case SKErrorPaymentInvalid:
    case SKErrorPaymentNotAllowed:
    case SKErrorPaymentCancelled:
      return 1;
    case SKErrorStoreProductNotAvailable:
      return 6;
    case SKErrorCloudServiceRevoked:
    case SKErrorCloudServicePermissionDenied:
    case SKErrorCloudServiceNetworkConnectionFailed:
      return 10;
    case SKErrorPrivacyAcknowledgementRequired:
      return 11;
    case SKErrorUnauthorizedRequestData:
      return 12;
    case SKErrorInvalidSignature:
    case SKErrorInvalidOfferPrice:
    case SKErrorInvalidOfferIdentifier:
      return 13;
    case SKErrorMissingOfferParams:
      return 14;
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
