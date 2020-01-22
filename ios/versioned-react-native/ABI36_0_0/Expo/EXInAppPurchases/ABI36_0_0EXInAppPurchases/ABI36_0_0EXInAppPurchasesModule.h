//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMExportedModule.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistryConsumer.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitterService.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI36_0_0EXInAppPurchasesModule : ABI36_0_0UMExportedModule <ABI36_0_0UMEventEmitter, ABI36_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
