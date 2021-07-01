#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventEmitter.h>

@interface ABI42_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI42_0_0StripeSdk, ABI42_0_0RCTEventEmitter)


ABI42_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject)

ABI42_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  handleCardAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(NSDictionary)params
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  confirmPaymentMethod:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )

ABI42_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI42_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI42_0_0RCTPromiseRejectBlock)reject
                  )


@end
