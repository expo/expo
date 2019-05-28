//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <StoreKit/StoreKit.h>

@interface EXInAppPurchasesModule : UMExportedModule <UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver> {
  UMPromiseResolveBlock resolve;
  UMPromiseRejectBlock reject;
}
  @property (nonatomic, weak) UMModuleRegistry *moduleRegistry;
  @property (strong, nonatomic) SKProductsRequest *request;
  @property (strong, nonatomic) NSArray<SKProduct*> *products;
@end
