#import <ABI43_0_0React/ABI43_0_0RCTBridgeModule.h>
#import <ABI43_0_0React/ABI43_0_0RCTEventEmitter.h>

@interface ABI43_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI43_0_0StripeSdk, ABI43_0_0RCTEventEmitter)


ABI43_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  openApplePaySetup: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject)

ABI43_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  handleCardAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )

ABI43_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI43_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI43_0_0RCTPromiseRejectBlock)reject
                  )


@end
