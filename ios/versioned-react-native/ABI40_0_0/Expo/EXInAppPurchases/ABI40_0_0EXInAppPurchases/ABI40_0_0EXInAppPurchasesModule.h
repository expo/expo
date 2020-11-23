//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMExportedModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitterService.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI40_0_0EXInAppPurchasesModule : ABI40_0_0UMExportedModule <ABI40_0_0UMEventEmitter, ABI40_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
