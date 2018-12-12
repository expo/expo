// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKPaymentObserver.h"

#import <StoreKit/StoreKit.h>

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKGateKeeperManager.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

static NSString *const FBSDKAppEventParameterImplicitlyLoggedPurchase = @"_implicitlyLogged";
static NSString *const FBSDKAppEventNamePurchaseFailed = @"fb_mobile_purchase_failed";
static NSString *const FBSDKAppEventNamePurchaseRestored = @"fb_mobile_purchase_restored";
static NSString *const FBSDKAppEventParameterNameInAppPurchaseType = @"fb_iap_product_type";
static NSString *const FBSDKAppEventParameterNameProductTitle = @"fb_content_title";
static NSString *const FBSDKAppEventParameterNameTransactionID = @"fb_transaction_id";
static NSString *const FBSDKAppEventParameterNameTransactionDate = @"fb_transaction_date";
static NSString *const FBSDKAppEventParameterNameSubscriptionPeriod = @"fb_iap_subs_period";
static int const FBSDKMaxParameterValueLength = 100;
static NSMutableArray *g_pendingRequestors;

@interface FBSDKPaymentProductRequestor : NSObject<SKProductsRequestDelegate>

@property (nonatomic, retain) SKPaymentTransaction *transaction;

- (instancetype)initWithTransaction:(SKPaymentTransaction*)transaction;
- (void)resolveProducts;

@end

@interface FBSDKPaymentObserver() <SKPaymentTransactionObserver>
@end

@implementation FBSDKPaymentObserver
{
  BOOL _observingTransactions;
}

+ (void)startObservingTransactions
{
  [[self singleton] startObservingTransactions];
}

+ (void)stopObservingTransactions
{
  [[self singleton] stopObservingTransactions];
}

//
// Internal methods
//

+ (FBSDKPaymentObserver *)singleton
{
  static dispatch_once_t pred;
  static FBSDKPaymentObserver *shared = nil;

  dispatch_once(&pred, ^{
    shared = [[FBSDKPaymentObserver alloc] init];
  });
  return shared;
}

- (instancetype) init
{
  self = [super init];
  if (self) {
    _observingTransactions = NO;
  }
  return self;
}

- (void)startObservingTransactions
{
  @synchronized (self) {
    if (!_observingTransactions) {
      [(SKPaymentQueue *)[fbsdkdfl_SKPaymentQueueClass() defaultQueue] addTransactionObserver:self];
      _observingTransactions = YES;
    }
  }
}

- (void)stopObservingTransactions
{
  @synchronized (self) {
    if (_observingTransactions) {
      [(SKPaymentQueue *)[fbsdkdfl_SKPaymentQueueClass() defaultQueue] removeTransactionObserver:self];
      _observingTransactions = NO;
    }
  }
}

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray *)transactions
{
  for (SKPaymentTransaction *transaction in transactions) {
    switch (transaction.transactionState) {
      case SKPaymentTransactionStatePurchasing:
      case SKPaymentTransactionStatePurchased:
      case SKPaymentTransactionStateFailed:
      case SKPaymentTransactionStateRestored:
        [self handleTransaction:transaction];
        break;
      case SKPaymentTransactionStateDeferred:
        break;
    }
  }
}

- (void)handleTransaction:(SKPaymentTransaction *)transaction
{
  // Ignore restored transaction
  if (transaction.originalTransaction != nil) {
    return;
  }
  FBSDKPaymentProductRequestor *productRequest = [[FBSDKPaymentProductRequestor alloc] initWithTransaction:transaction];
  [productRequest resolveProducts];
}

@end

@interface FBSDKPaymentProductRequestor()
@property (nonatomic, retain) SKProductsRequest *productRequest;
@end

@implementation FBSDKPaymentProductRequestor

+ (void)initialize
{
  if ([self class] == [FBSDKPaymentProductRequestor class]) {
    g_pendingRequestors = [[NSMutableArray alloc] init];
  }
}

- (instancetype)initWithTransaction:(SKPaymentTransaction*)transaction
{
  self = [super init];
  if (self) {
    _transaction = transaction;
  }
  return self;
}

- (void)setProductRequest:(SKProductsRequest *)productRequest
{
  if (productRequest != _productRequest) {
    if (_productRequest) {
      _productRequest.delegate = nil;
    }
    _productRequest = productRequest;
  }
}

- (void)resolveProducts
{
  NSString *productId = self.transaction.payment.productIdentifier;
  NSSet *productIdentifiers = [NSSet setWithObjects:productId, nil];
  self.productRequest = [[fbsdkdfl_SKProductsRequestClass() alloc] initWithProductIdentifiers:productIdentifiers];
  self.productRequest.delegate = self;
  @synchronized(g_pendingRequestors) {
    [g_pendingRequestors addObject:self];
  }
  [self.productRequest start];
}

- (NSString *)getTruncatedString:(NSString *)inputString
{
  if (!inputString) {
    return @"";
  }

  return [inputString length] <= FBSDKMaxParameterValueLength ? inputString : [inputString substringToIndex:FBSDKMaxParameterValueLength];
}

- (void)logTransactionEvent:(SKProduct *)product
{
  NSString *eventName = nil;
  NSString *transactionID = nil;
  NSString *transactionDate = nil;
  NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
  [formatter setDateFormat:@"yyyy-MM-dd HH:mm:ssZ"];
  switch (self.transaction.transactionState) {
    case SKPaymentTransactionStatePurchasing:
      eventName = FBSDKAppEventNameInitiatedCheckout;
      break;
    case SKPaymentTransactionStatePurchased:
      eventName = FBSDKAppEventNamePurchased;
      transactionID = self.transaction.transactionIdentifier;
      transactionDate = [formatter stringFromDate:self.transaction.transactionDate];
      break;
    case SKPaymentTransactionStateFailed:
      eventName = FBSDKAppEventNamePurchaseFailed;
      break;
    case SKPaymentTransactionStateRestored:
      eventName = FBSDKAppEventNamePurchaseRestored;
      transactionDate = [formatter stringFromDate:self.transaction.transactionDate];
      break;
    case SKPaymentTransactionStateDeferred:
      return;
  }
  if (!eventName) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                       formatString:@"FBSDKPaymentObserver logTransactionEvent: event name cannot be nil"];
    return;
  }

  SKPayment *payment = self.transaction.payment;
  NSMutableDictionary *eventParameters = [NSMutableDictionary dictionaryWithDictionary: @{
                                                                                          FBSDKAppEventParameterNameContentID: payment.productIdentifier ?: @"",
                                                                                          FBSDKAppEventParameterNameNumItems: @(payment.quantity),
                                                                                          FBSDKAppEventParameterNameTransactionDate: transactionDate ?: @"",
                                                                                          }];
  double totalAmount = 0;
  if (product) {
    totalAmount = payment.quantity * product.price.doubleValue;
    [eventParameters addEntriesFromDictionary: @{
                                                 FBSDKAppEventParameterNameCurrency: [product.priceLocale objectForKey:NSLocaleCurrencyCode],
                                                 FBSDKAppEventParameterNameNumItems: @(payment.quantity),
                                                 FBSDKAppEventParameterNameProductTitle: [self getTruncatedString:product.localizedTitle],
                                                 FBSDKAppEventParameterNameDescription: [self getTruncatedString:product.localizedDescription],
                                                 }];
#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_11_2
    if (@available(iOS 11.2, *)) {
      BOOL isSubscription = (product.subscriptionPeriod != nil) && ((unsigned long)product.subscriptionPeriod.numberOfUnits > 0);
      if (isSubscription) {
        if ([FBSDKGateKeeperManager boolForKey:@"app_events_if_auto_log_subs" appID:[FBSDKSettings appID] defaultValue:true]) {
          eventName = FBSDKAppEventNameSubscribe;
        }
        // subs inapp
        SKProductSubscriptionPeriod *period = product.subscriptionPeriod;
        NSString *unit = nil;
        switch (period.unit) {
          case SKProductPeriodUnitDay: unit = @"D"; break;
          case SKProductPeriodUnitWeek: unit = @"W"; break;
          case SKProductPeriodUnitMonth: unit = @"M"; break;
          case SKProductPeriodUnitYear: unit = @"Y"; break;
        }
        NSString *p = [NSString stringWithFormat:@"P%lu%@", (unsigned long)period.numberOfUnits, unit];
        [eventParameters setObject:p forKey:FBSDKAppEventParameterNameSubscriptionPeriod];
        [eventParameters setObject:@"subs" forKey:FBSDKAppEventParameterNameInAppPurchaseType];
      } else {
        [eventParameters setObject:@"inapp" forKey:FBSDKAppEventParameterNameInAppPurchaseType];
      }
    }
#endif
#endif
    if (transactionID) {
      [eventParameters setObject:transactionID forKey:FBSDKAppEventParameterNameTransactionID];
    }
  }

  [self logImplicitPurchaseEvent:eventName
                      valueToSum:totalAmount
                      parameters:eventParameters];
}

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response
{
  NSArray* products = response.products;
  NSArray* invalidProductIdentifiers = response.invalidProductIdentifiers;
  if (products.count + invalidProductIdentifiers.count != 1) {
    [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAppEvents
                       formatString:@"FBSDKPaymentObserver: Expect to resolve one product per request"];
  }
  SKProduct *product = nil;
  if (products.count) {
    product = products[0];
  }
  [self logTransactionEvent:product];
}

- (void)requestDidFinish:(SKRequest *)request
{
  [self cleanUp];
}

- (void)request:(SKRequest *)request didFailWithError:(NSError *)error
{
  [self logTransactionEvent:nil];
  [self cleanUp];
}

- (void)cleanUp
{
  @synchronized(g_pendingRequestors) {
    [g_pendingRequestors removeObject:self];
  }
}

- (void)logImplicitPurchaseEvent:(NSString *)eventName
                      valueToSum:(double)valueToSum
                      parameters:(NSDictionary *)parameters {
  NSMutableDictionary *eventParameters = [NSMutableDictionary dictionaryWithDictionary:parameters];

  if ([eventName isEqualToString:FBSDKAppEventNamePurchased]) {
    NSData* receipt = [self fetchDeviceReceipt];
    if (receipt) {
      NSString *base64encodedReceipt = [receipt base64EncodedStringWithOptions:0];
      eventParameters[@"receipt_data"] = base64encodedReceipt;
    }
  }

  [eventParameters setObject:@"1" forKey:FBSDKAppEventParameterImplicitlyLoggedPurchase];
  [FBSDKAppEvents logEvent:eventName
                valueToSum:valueToSum
                parameters:eventParameters];

  // Unless the behavior is set to only allow explicit flushing, we go ahead and flush, since purchase events
  // are relatively rare and relatively high value and worth getting across on wire right away.
  if ([FBSDKAppEvents flushBehavior] != FBSDKAppEventsFlushBehaviorExplicitOnly) {
    [[FBSDKAppEvents singleton] flushForReason:FBSDKAppEventsFlushReasonEagerlyFlushingEvent];
  }
}

// Fetch the current receipt for this application.
- (NSData*)fetchDeviceReceipt {
  NSURL *receiptURL = [[NSBundle bundleForClass:[self class]] appStoreReceiptURL];
  NSData *receipt = [NSData dataWithContentsOfURL:receiptURL];
  return receipt;
}

@end
