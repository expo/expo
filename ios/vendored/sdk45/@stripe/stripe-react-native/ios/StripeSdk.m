#import <ABI45_0_0React/ABI45_0_0RCTBridgeModule.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventEmitter.h>

@interface ABI45_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI45_0_0StripeSdk, ABI45_0_0RCTEventEmitter)


ABI45_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject)

ABI45_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

ABI45_0_0RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(NSString *)intentType
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )
ABI45_0_0RCT_EXTERN_METHOD(
                  collectBankAccount:(NSString *)intentType
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (ABI45_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI45_0_0RCTPromiseRejectBlock)reject
                  )

@end
