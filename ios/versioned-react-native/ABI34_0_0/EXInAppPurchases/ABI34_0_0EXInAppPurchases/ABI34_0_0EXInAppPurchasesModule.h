//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI34_0_0UMCore/ABI34_0_0UMExportedModule.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMModuleRegistryConsumer.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitterService.h>
#import <ABI34_0_0UMCore/ABI34_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI34_0_0EXInAppPurchasesModule : ABI34_0_0UMExportedModule <ABI34_0_0UMEventEmitter, ABI34_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
