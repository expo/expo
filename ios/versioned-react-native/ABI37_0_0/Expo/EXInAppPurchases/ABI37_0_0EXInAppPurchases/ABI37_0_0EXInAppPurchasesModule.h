//  Copyright © 2018 650 Industries. All rights reserved.

#import <ABI37_0_0UMCore/ABI37_0_0UMExportedModule.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistryConsumer.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitterService.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface ABI37_0_0EXInAppPurchasesModule : ABI37_0_0UMExportedModule <ABI37_0_0UMEventEmitter, ABI37_0_0UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
