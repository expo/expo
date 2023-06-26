#import <ABI49_0_0React/ABI49_0_0RCTBridgeModule.h>
#import <ABI49_0_0React/ABI49_0_0RCTEventEmitter.h>

@interface ABI49_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI49_0_0StripeSdk, ABI49_0_0RCTEventEmitter)


ABI49_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  isPlatformPaySupported:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  createPlatformPayPaymentMethod:(NSDictionary *)params
                  usesDeprecatedTokenFlow:(BOOL)usesDeprecatedTokenFlow
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  confirmPlatformPay:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  isPaymentIntent:(BOOL)isPaymentIntent
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  dismissPlatformPay: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  updatePlatformPaySheet:(NSArray *)summaryItems
                  shippingMethods:(NSArray *)summaryItems
                  errors: (NSArray *)errors
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject)

ABI49_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  returnURL:(NSString *)returnURL
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  initPaymentSheetWithOrderTracking:(NSDictionary *)params
                  callback:(ABI49_0_0RCTResponseSenderBlock)orderTrackingCallback
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(NSDictionary *)options
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  resetPaymentSheetCustomer:(ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )

ABI49_0_0RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  collectBankAccount:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  canAddCardToWallet:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  isCardInWallet:(NSDictionary *)params
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  collectBankAccountToken:(NSString *)clientSecret
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  collectFinancialConnectionsAccounts:(NSString *)clientSecret
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
ABI49_0_0RCT_EXTERN_METHOD(
                  configureOrderTracking:(NSString *)orderTypeIdentifier
                  orderIdentifier:(NSString *)orderIdentifier
                  webServiceUrl:(NSString *)webServiceUrl
                  authenticationToken:(NSString *)authenticationToken
                  resolver: (ABI49_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI49_0_0RCTPromiseRejectBlock)reject
                  )
@end
