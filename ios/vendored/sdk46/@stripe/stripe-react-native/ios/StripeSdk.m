#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventEmitter.h>

@interface ABI46_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI46_0_0StripeSdk, ABI46_0_0RCTEventEmitter)


ABI46_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject)

ABI46_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

ABI46_0_0RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )
ABI46_0_0RCT_EXTERN_METHOD(
                  collectBankAccount:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )
ABI46_0_0RCT_EXTERN_METHOD(
                  isCardInWallet:(NSDictionary *)params
                  resolver: (ABI46_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI46_0_0RCTPromiseRejectBlock)reject
                  )

@end
