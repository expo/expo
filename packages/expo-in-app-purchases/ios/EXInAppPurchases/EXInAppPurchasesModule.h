//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <StoreKit/StoreKit.h>

@interface EXInAppPurchasesModule : UMExportedModule <UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
