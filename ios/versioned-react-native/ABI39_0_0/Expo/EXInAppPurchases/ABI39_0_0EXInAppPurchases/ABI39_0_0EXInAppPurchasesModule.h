//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI39_0_0UMCore/ABI39_0_0UMExportedModule.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMModuleRegistryConsumer.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitterService.h>
#import <ABI39_0_0UMCore/ABI39_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI39_0_0EXInAppPurchasesModule : ABI39_0_0UMExportedModule <ABI39_0_0UMEventEmitter, ABI39_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
