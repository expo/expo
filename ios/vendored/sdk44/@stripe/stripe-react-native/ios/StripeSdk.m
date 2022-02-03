#import <ABI44_0_0React/ABI44_0_0RCTBridgeModule.h>
#import <ABI44_0_0React/ABI44_0_0RCTEventEmitter.h>

@interface ABI44_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI44_0_0StripeSdk, ABI44_0_0RCTEventEmitter)


ABI44_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject)

ABI44_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  handleCardAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )

ABI44_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI44_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI44_0_0RCTPromiseRejectBlock)reject
                  )


@end
