//
//  GADInAppPurchase.h
//  Google Mobile Ads SDK
//
//  Copyright 2013 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>
#import <StoreKit/StoreKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol GADDefaultInAppPurchaseDelegate;

#pragma mark - Default Purchase Flow

/// The consumable in-app purchase item that has been purchased by the user. The purchase flow is
/// handled by the Google Mobile Ads SDK.
/// Instances of this class are created and passed to your in-app purchase delegate after the user
/// has successfully paid for a product. Your code must correctly deliver the product to the user
/// and then call the didCompletePurchase method to finish the transaction.
GAD_DEPRECATED_ATTRIBUTE
@interface GADDefaultInAppPurchase : NSObject

/// Enables the default consumable product in-app purchase flow handled by the Google Mobile Ads
/// SDK. The GADDefaultInAppPurchaseDelegate object is retained while the default purchase flow is
/// enabled. This method adds a SKPaymentTransactionObserver to the default SKPaymentQueue.
///
/// Call this method early in your application to handle unfinished transactions from previous
/// application sessions. For example, call this method in your application delegate's
/// application:didFinishLaunchingWithOptions: method.
+ (void)enableDefaultPurchaseFlowWithDelegate:(id<GADDefaultInAppPurchaseDelegate>)delegate;

/// Disables the default in-app purchase flow handled by the Google Mobile Ads SDK and releases the
/// associated GADDefaultInAppPurchaseDelegate object.
+ (void)disableDefaultPurchaseFlow;

/// The in-app purchase product ID.
@property(nonatomic, readonly, copy) NSString *productID;

/// The product quantity.
@property(nonatomic, readonly, assign) NSInteger quantity;

/// The purchased item's completed payment transaction. Your application can use this property's
/// data to save a permanent record of the completed payment. The default purchase flow will finish
/// the transaction on your behalf. Do not finish the transaction yourself.
@property(nonatomic, readonly, strong) SKPaymentTransaction *paymentTransaction;

/// The in-app purchase delegate object must first deliver the user's item and then call this
/// method. Failure to call this method will result in duplicate purchase notifications.
- (void)finishTransaction;

@end

#pragma mark - Custom Purchase Flow

/// Enum of the different statuses resulting from processing a purchase.
GAD_DEPRECATED_ATTRIBUTE
typedef NS_ENUM(NSInteger, GADInAppPurchaseStatus) {
  kGADInAppPurchaseStatusError = 0,          ///< Error occurred while processing the purchase.
  kGADInAppPurchaseStatusSuccessful = 1,     ///< Purchase was completed successfully.
  kGADInAppPurchaseStatusCancel = 2,         ///< Purchase was cancelled by the user.
  kGADInAppPurchaseStatusInvalidProduct = 3  ///< Error occurred while looking up the product.
};

/// The in-app purchase item to be purchased with the purchase flow handled by you, the
/// application developer.
/// Instances of this class are created and passed to your GADInAppPurchaseDelegate object when
/// users click a buy button. It is important to report the result of the purchase back to the SDK
/// in order to track metrics about the transaction.
GAD_DEPRECATED_ATTRIBUTE
@interface GADInAppPurchase : NSObject

/// The in-app purchase product ID.
@property(nonatomic, readonly, copy) NSString *productID;

/// The product quantity.
@property(nonatomic, readonly, assign) NSInteger quantity;

/// The GADInAppPurchaseDelegate object must call this method after handling the in-app purchase
/// for both successful and unsuccessful purchase attempts. This method reports ad conversion and
/// purchase status information to Google.
- (void)reportPurchaseStatus:(GADInAppPurchaseStatus)purchaseStatus;

@end

NS_ASSUME_NONNULL_END
