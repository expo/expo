//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI35_0_0UMCore/ABI35_0_0UMExportedModule.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMModuleRegistryConsumer.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitterService.h>
#import <ABI35_0_0UMCore/ABI35_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI35_0_0EXInAppPurchasesModule : ABI35_0_0UMExportedModule <ABI35_0_0UMEventEmitter, ABI35_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
