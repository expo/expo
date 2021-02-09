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

#import <FBSDKCoreKit/FBSDKCoreKit+Internal.h>

#import "FBSDKAppEvents+Internal.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings.h"

static NSString *const FBSDKPaymentObserverOriginalTransactionKey = @"com.facebook.appevents.PaymentObserver.originalTransaction";
static NSString *const FBSDKPaymentObserverDelimiter = @",";

static NSString *const FBSDKAppEventParameterImplicitlyLoggedPurchase = @"_implicitlyLogged";
static NSString *const FBSDKAppEventNamePurchaseFailed = @"fb_mobile_purchase_failed";
static NSString *const FBSDKAppEventNamePurchaseRestored = @"fb_mobile_purchase_restored";
static NSString *const FBSDKAppEventParameterNameInAppPurchaseType = @"fb_iap_product_type";
static NSString *const FBSDKAppEventParameterNameProductTitle = @"fb_content_title";
static NSString *const FBSDKAppEventParameterNameOriginalTransactionID = @"fb_original_transaction_id";
static NSString *const FBSDKAppEventParameterNameTransactionID = @"fb_transaction_id";
static NSString *const FBSDKAppEventParameterNameTransactionDate = @"fb_transaction_date";
static NSString *const FBSDKAppEventParameterNameSubscriptionPeriod = @"fb_iap_subs_period";
static NSString *const FBSDKAppEventParameterNameIsStartTrial = @"fb_iap_is_start_trial";
static NSString *const FBSDKAppEventParameterNameHasFreeTrial = @"fb_iap_has_free_trial";
static NSString *const FBSDKAppEventParameterNameTrialPeriod = @"fb_iap_trial_period";
static NSString *const FBSDKAppEventParameterNameTrialPrice = @"fb_iap_trial_price";
static int const FBSDKMaxParameterValueLength = 100;
static NSMutableArray *g_pendingRequestors;

static NSString *const FBSDKGateKeeperAppEventsIfAutoLogSubs = @"app_events_if_auto_log_subs";

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

#pragma mark - Internal Methods

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
  FBSDKPaymentProductRequestor *productRequest = [[FBSDKPaymentProductRequestor alloc] initWithTransaction:transaction];
  [productRequest resolveProducts];
}

@end

@interface FBSDKPaymentProductRequestor()
@property (nonatomic, retain) SKProductsRequest *productRequest;
@end

@implementation FBSDKPaymentProductRequestor
{
  NSMutableSet<NSString *> *_originalTransactionSet;
  NSSet<NSString *> *_eventsWithReceipt;
  NSDateFormatter *_formatter;
}

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
    _formatter = [[NSDateFormatter alloc] init];
    _formatter.dateFormat = @"yyyy-MM-dd HH:mm:ssZ";
    NSString *data = [[NSUserDefaults standardUserDefaults] stringForKey:FBSDKPaymentObserverOriginalTransactionKey];
    _eventsWithReceipt = [NSSet setWithArray:@[FBSDKAppEventNamePurchased, FBSDKAppEventNameSubscribe,
                                               FBSDKAppEventNameStartTrial]];
    if (data) {
      _originalTransactionSet = [NSMutableSet setWithArray:[data componentsSeparatedByString:FBSDKPaymentObserverDelimiter]];
    } else {
      _originalTransactionSet = [[NSMutableSet alloc] init];
    }
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

  return inputString.length <= FBSDKMaxParameterValueLength ? inputString : [inputString substringToIndex:FBSDKMaxParameterValueLength];
}

- (void)logTransactionEvent:(SKProduct *)product
{
  if ([self isSubscription:product] &&
      [FBSDKGateKeeperManager boolForKey:FBSDKGateKeeperAppEventsIfAutoLogSubs
                            defaultValue:NO]) {
    [self logImplicitSubscribeTransaction:self.transaction ofProduct:product];
  } else {
    [self logImplicitPurchaseTransaction:self.transaction ofProduct:product];
  }
}

- (BOOL)isSubscription:(SKProduct *)product
{
#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_1
  if (@available(iOS 11.2, *)) {
    return (product.subscriptionPeriod != nil) && ((unsigned long)product.subscriptionPeriod.numberOfUnits > 0);
  }
#endif
#endif
  return NO;
}

- (NSMutableDictionary<NSString *, id> *)getEventParametersOfProduct:(SKProduct *)product
                                                     withTransaction:(SKPaymentTransaction *)transaction
{
  NSString *transactionID = nil;
  NSString *transactionDate = nil;
  switch (transaction.transactionState) {
    case SKPaymentTransactionStatePurchasing:
      break;
    case SKPaymentTransactionStatePurchased:
      transactionID = self.transaction.transactionIdentifier;
      transactionDate = [_formatter stringFromDate:self.transaction.transactionDate];
      break;
    case SKPaymentTransactionStateFailed:
      break;
    case SKPaymentTransactionStateRestored:
      transactionDate = [_formatter stringFromDate:self.transaction.transactionDate];
      break;
    default: break;
  }
  SKPayment *payment = transaction.payment;
  NSMutableDictionary *eventParameters = [NSMutableDictionary dictionaryWithDictionary: @{
                                                                                          FBSDKAppEventParameterNameContentID: payment.productIdentifier ?: @"",
                                                                                          FBSDKAppEventParameterNameNumItems: @(payment.quantity),
                                                                                          FBSDKAppEventParameterNameTransactionDate: transactionDate ?: @"",
                                                                                          }];
  if (product) {
    [eventParameters addEntriesFromDictionary: @{
                                                 FBSDKAppEventParameterNameCurrency: [product.priceLocale objectForKey:NSLocaleCurrencyCode],
                                                 FBSDKAppEventParameterNameNumItems: @(payment.quantity),
                                                 FBSDKAppEventParameterNameProductTitle: [self getTruncatedString:product.localizedTitle],
                                                 FBSDKAppEventParameterNameDescription: [self getTruncatedString:product.localizedDescription],
                                                 }];
    if (transactionID) {
      eventParameters[FBSDKAppEventParameterNameTransactionID] = transactionID;
    }
  }

#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_1
  if (@available(iOS 11.2, *)) {
    if ([self isSubscription:product]) {
      // subs inapp
      eventParameters[FBSDKAppEventParameterNameSubscriptionPeriod] = [self durationOfSubscriptionPeriod:product.subscriptionPeriod];
      eventParameters[FBSDKAppEventParameterNameInAppPurchaseType] = @"subs";
      eventParameters[FBSDKAppEventParameterNameIsStartTrial] = [self isStartTrial:transaction ofProduct:product] ? @"1" : @"0";
      // trial information for subs
      SKProductDiscount *discount = product.introductoryPrice;
      if (discount) {
        if (discount.paymentMode == SKProductDiscountPaymentModeFreeTrial) {
          eventParameters[FBSDKAppEventParameterNameHasFreeTrial] = @"1";
        } else {
          eventParameters[FBSDKAppEventParameterNameHasFreeTrial] = @"0";
        }
        eventParameters[FBSDKAppEventParameterNameTrialPeriod] = [self durationOfSubscriptionPeriod:discount.subscriptionPeriod];
        eventParameters[FBSDKAppEventParameterNameTrialPrice] = discount.price;
      }
    } else {
      eventParameters[FBSDKAppEventParameterNameInAppPurchaseType] = @"inapp";
    }
  }
#endif
#endif
  return eventParameters;
}

- (void)appendOriginalTransactionID:(NSString *)transactionID
{
  if (!transactionID) {
    return;
  }
  [_originalTransactionSet addObject:transactionID];
  [[NSUserDefaults standardUserDefaults] setObject:[[_originalTransactionSet allObjects] componentsJoinedByString:FBSDKPaymentObserverDelimiter]
                                            forKey:FBSDKPaymentObserverOriginalTransactionKey];
}

- (void)clearOriginalTransactionID:(NSString *)transactionID
{
  if (!transactionID) {
    return;
  }
  [_originalTransactionSet removeObject:transactionID];
  [[NSUserDefaults standardUserDefaults] setObject:[[_originalTransactionSet allObjects] componentsJoinedByString:FBSDKPaymentObserverDelimiter]
                                            forKey:FBSDKPaymentObserverOriginalTransactionKey];
}

- (BOOL)isStartTrial:(SKPaymentTransaction *)transaction
           ofProduct:(SKProduct *)product
{
#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_1
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_4
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_12_1
  // promotional offer starting from iOS 12.2
  if (@available(iOS 12.2, *)) {
    SKPaymentDiscount *paymentDiscount = transaction.payment.paymentDiscount;
    if (paymentDiscount) {
      NSArray<SKProductDiscount *> *discounts = product.discounts;
      for (SKProductDiscount *discount in discounts) {
        if (discount.paymentMode == SKProductDiscountPaymentModeFreeTrial &&
            [paymentDiscount.identifier isEqualToString:discount.identifier]) {
          return YES;
        }
      }
    }
  }
#endif
#endif
  // introductory offer starting from iOS 11.2
  if (@available(iOS 11.2, *)) {
    if (product.introductoryPrice &&
        product.introductoryPrice.paymentMode == SKProductDiscountPaymentModeFreeTrial) {
      NSString *originalTransactionID = transaction.originalTransaction.transactionIdentifier;
      // only consider the very first trial transaction as start trial
      if (!originalTransactionID) {
        return YES;
      }
    }
  }
#endif
#endif
  return NO;
}

- (BOOL)hasStartTrial:(SKProduct *)product
{
#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_1
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_4
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_12_1
  // promotional offer starting from iOS 12.2
  if (@available(iOS 12.2, *)) {
    NSArray<SKProductDiscount *> *discounts = product.discounts;
    for (SKProductDiscount *discount in discounts) {
      if (discount.paymentMode == SKProductDiscountPaymentModeFreeTrial) {
        return YES;
      }
    }
  }
#endif
#endif
  // introductory offer starting from iOS 11.2
  if (@available(iOS 11.2, *)) {
    if (product.introductoryPrice && (product.introductoryPrice.paymentMode == SKProductDiscountPaymentModeFreeTrial)) {
      return YES;
    }
  }
#endif
#endif
  return NO;
}

- (NSString *)durationOfSubscriptionPeriod:(id)subcriptionPeriod
{
#if !TARGET_OS_TV
#if __IPHONE_OS_VERSION_MAX_ALLOWED > __IPHONE_11_1
  if (@available(iOS 11.2, *)) {
    if (subcriptionPeriod && [subcriptionPeriod isKindOfClass:[SKProductSubscriptionPeriod class]]) {
      SKProductSubscriptionPeriod *period = (SKProductSubscriptionPeriod *)subcriptionPeriod;
      NSString *unit = nil;
      switch (period.unit) {
        case SKProductPeriodUnitDay: unit = @"D"; break;
        case SKProductPeriodUnitWeek: unit = @"W"; break;
        case SKProductPeriodUnitMonth: unit = @"M"; break;
        case SKProductPeriodUnitYear: unit = @"Y"; break;
      }
      return [NSString stringWithFormat:@"P%lu%@", (unsigned long)period.numberOfUnits, unit];
    }
  }
#endif
#endif
  return nil;
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

- (void)logImplicitSubscribeTransaction:(SKPaymentTransaction *)transaction
                              ofProduct:(SKProduct *)product
{
  NSString *eventName = nil;
  NSString *originalTransactionID = transaction.originalTransaction.transactionIdentifier;
  switch (transaction.transactionState) {
    case SKPaymentTransactionStatePurchasing:
      eventName = @"SubscriptionInitiatedCheckout";
      break;
    case SKPaymentTransactionStatePurchased:
      if ([self isStartTrial:transaction ofProduct:product]) {
        eventName = FBSDKAppEventNameStartTrial;
        [self clearOriginalTransactionID:originalTransactionID];
      } else {
        if (originalTransactionID && [_originalTransactionSet containsObject:originalTransactionID]) {
          return;
        }
        eventName = FBSDKAppEventNameSubscribe;
        [self appendOriginalTransactionID:(originalTransactionID ?: transaction.transactionIdentifier)];
      }
      break;
    case SKPaymentTransactionStateFailed:
      eventName = @"SubscriptionFailed";
      break;
    case SKPaymentTransactionStateRestored:
      eventName = @"SubscriptionRestore";
      break;
    case SKPaymentTransactionStateDeferred:
      return;
  }

  double totalAmount = 0;
  if (product) {
    totalAmount = transaction.payment.quantity * product.price.doubleValue;
  }

  [self logImplicitTransactionEvent:eventName
                         valueToSum:totalAmount
                         parameters:[self getEventParametersOfProduct:product withTransaction:transaction]];
}

- (void)logImplicitPurchaseTransaction:(SKPaymentTransaction *)transaction
                             ofProduct:(SKProduct *)product
{
  NSString *eventName = nil;
  switch (transaction.transactionState) {
    case SKPaymentTransactionStatePurchasing:
      eventName = FBSDKAppEventNameInitiatedCheckout;
      break;
    case SKPaymentTransactionStatePurchased:
      eventName = FBSDKAppEventNamePurchased;
      break;
    case SKPaymentTransactionStateFailed:
      eventName = FBSDKAppEventNamePurchaseFailed;
      break;
    case SKPaymentTransactionStateRestored:
      eventName = FBSDKAppEventNamePurchaseRestored;
      break;
    case SKPaymentTransactionStateDeferred:
      return;
  }

  double totalAmount = 0;
  if (product) {
    totalAmount = transaction.payment.quantity * product.price.doubleValue;
  }

  [self logImplicitTransactionEvent:eventName
                         valueToSum:totalAmount
                         parameters:[self getEventParametersOfProduct:product withTransaction:transaction]];
}

- (void)logImplicitTransactionEvent:(NSString *)eventName
                         valueToSum:(double)valueToSum
                         parameters:(NSDictionary<NSString *, id> *)parameters
{
  NSMutableDictionary *eventParameters = [NSMutableDictionary dictionaryWithDictionary:parameters];

  if ([_eventsWithReceipt containsObject:eventName]) {
    NSData* receipt = [self fetchDeviceReceipt];
    if (receipt) {
      NSString *base64encodedReceipt = [receipt base64EncodedStringWithOptions:0];
      eventParameters[@"receipt_data"] = base64encodedReceipt;
    }
  }

  eventParameters[FBSDKAppEventParameterImplicitlyLoggedPurchase] = @"1";
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
- (NSData*)fetchDeviceReceipt
{
  NSURL *receiptURL = [NSBundle bundleForClass:[self class]].appStoreReceiptURL;
  NSData *receipt = [NSData dataWithContentsOfURL:receiptURL];
  return receipt;
}

@end
