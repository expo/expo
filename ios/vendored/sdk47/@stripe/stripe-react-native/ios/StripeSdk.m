#import <ABI47_0_0React/ABI47_0_0RCTBridgeModule.h>
#import <ABI47_0_0React/ABI47_0_0RCTEventEmitter.h>

@interface ABI47_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI47_0_0StripeSdk, ABI47_0_0RCTEventEmitter)


ABI47_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject)

ABI47_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  returnURL:(NSString *)returnURL
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )

ABI47_0_0RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
ABI47_0_0RCT_EXTERN_METHOD(
                  collectBankAccount:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
ABI47_0_0RCT_EXTERN_METHOD(
                  canAddCardToWallet:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
ABI47_0_0RCT_EXTERN_METHOD(
                  isCardInWallet:(NSDictionary *)params
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
ABI47_0_0RCT_EXTERN_METHOD(
                  collectBankAccountToken:(NSString *)clientSecret
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
ABI47_0_0RCT_EXTERN_METHOD(
                  collectFinancialConnectionsAccounts:(NSString *)clientSecret
                  resolver: (ABI47_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI47_0_0RCTPromiseRejectBlock)reject
                  )
@end
