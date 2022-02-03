//  Copyright © 2018 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXExportedModule.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>
#import <ExpoModulesCore/EXEventEmitterService.h>
#import <ExpoModulesCore/EXEventEmitter.h>
#import <StoreKit/StoreKit.h>

@interface EXInAppPurchasesModule : EXExportedModule <EXEventEmitter, EXModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver>
@end
