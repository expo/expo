#import <Foundation/Foundation.h>
#import <StoreKit/StoreKit.h>
#import "SEGAnalytics.h"

NS_ASSUME_NONNULL_BEGIN


@interface SEGStoreKitTracker : NSObject <SKPaymentTransactionObserver, SKProductsRequestDelegate>

+ (instancetype)trackTransactionsForAnalytics:(SEGAnalytics *)analytics;

@end

NS_ASSUME_NONNULL_END
