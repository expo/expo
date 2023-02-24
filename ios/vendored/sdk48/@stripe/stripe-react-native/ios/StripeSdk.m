#import <ABI48_0_0React/ABI48_0_0RCTBridgeModule.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventEmitter.h>

@interface ABI48_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI48_0_0StripeSdk, ABI48_0_0RCTEventEmitter)


ABI48_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  isPlatformPaySupported:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  createPlatformPayPaymentMethod:(NSDictionary *)params
                  usesDeprecatedTokenFlow:(BOOL)usesDeprecatedTokenFlow
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  confirmPlatformPay:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  isPaymentIntent:(BOOL)isPaymentIntent
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  dismissPlatformPay: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  updatePlatformPaySheet:(NSArray *)summaryItems
                  shippingMethods:(NSArray *)summaryItems
                  errors: (NSArray *)errors
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject)

ABI48_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  returnURL:(NSString *)returnURL
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  resetPaymentSheetCustomer:(ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )

ABI48_0_0RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
ABI48_0_0RCT_EXTERN_METHOD(
                  collectBankAccount:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
ABI48_0_0RCT_EXTERN_METHOD(
                  canAddCardToWallet:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
ABI48_0_0RCT_EXTERN_METHOD(
                  isCardInWallet:(NSDictionary *)params
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
ABI48_0_0RCT_EXTERN_METHOD(
                  collectBankAccountToken:(NSString *)clientSecret
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
ABI48_0_0RCT_EXTERN_METHOD(
                  collectFinancialConnectionsAccounts:(NSString *)clientSecret
                  resolver: (ABI48_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI48_0_0RCTPromiseRejectBlock)reject
                  )
@end
