//
//  GADInAppPurchaseDelegate.h
//  Google Mobile Ads SDK
//
//  Copyright 2013 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADDefaultInAppPurchase;
@class GADInAppPurchase;

NS_ASSUME_NONNULL_BEGIN

#pragma mark - Default Purchase Flow

/// In-app purchase delegate protocol for default purchase handling. The delegate must deliver
/// the purchased item then call the GADDefaultInAppPurchase object's finishTransaction method.
GAD_DEPRECATED_ATTRIBUTE
@protocol GADDefaultInAppPurchaseDelegate <NSObject>

/// Called when the user successfully paid for a purchase. You must first deliver the purchased
/// item to the user, then call defaultInAppPurchase's finishTransaction method.
- (void)userDidPayForPurchase:(GADDefaultInAppPurchase *)defaultInAppPurchase;

@optional

/// Called when the user clicks on the buy button of an in-app purchase ad. Return YES if the
/// default purchase flow should be started to purchase the item, otherwise return NO. If not
/// implemented, defaults to YES.
- (BOOL)shouldStartPurchaseForProductID:(NSString *)productID quantity:(NSInteger)quantity;

@end

#pragma mark - Custom Purchase Flow

/// In-app purchase delegate protocol for custom purchase handling. The delegate must handle the
/// product purchase flow then call the GADInAppPurchase object's reportPurchaseStatus: method.
GAD_DEPRECATED_ATTRIBUTE
@protocol GADInAppPurchaseDelegate <NSObject>

/// Called when the user clicks on the buy button of an in-app purchase ad. After the receiver
/// handles the purchase, it must call the GADInAppPurchase object's reportPurchaseStatus: method.
- (void)didReceiveInAppPurchase:(GADInAppPurchase *)purchase;

@end

NS_ASSUME_NONNULL_END
