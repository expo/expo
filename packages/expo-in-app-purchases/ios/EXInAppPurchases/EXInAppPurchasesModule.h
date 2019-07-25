//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <UMCore/UMEventEmitterService.h>
#import <UMCore/UMEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface EXInAppPurchasesModule : UMExportedModule <UMEventEmitter, UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
