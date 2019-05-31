//  Copyright © 2018 650 Industries. All rights reserved.

#import <UMCore/UMExportedModule.h>
#import <UMCore/UMModuleRegistryConsumer.h>
#import <StoreKit/StoreKit.h>

@interface EXInAppPurchasesModule : UMExportedModule <UMModuleRegistryConsumer, SKProductsRequestDelegate, SKPaymentTransactionObserver> {
  NSMutableDictionary *promises;
  Boolean queryingItems;
}
  @property (weak, nonatomic) UMModuleRegistry *moduleRegistry;
  @property (strong, nonatomic) SKProductsRequest *request;
  @property (strong, nonatomic) SKReceiptRefreshRequest *receiptRequest;
  @property (strong, nonatomic) NSArray<SKProduct*> *products;
@end
