#import <ABI40_0_0React/ABI40_0_0RCTBridgeModule.h>
#import <ABI40_0_0React/ABI40_0_0RCTEventEmitter.h>

@interface ABI40_0_0RCT_EXTERN_MODULE(StripeSdk, ABI40_0_0RCTEventEmitter)


ABI40_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  )

ABI40_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject)

ABI40_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject)

ABI40_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject)

ABI40_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject)

ABI40_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject)

ABI40_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )

ABI40_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )

ABI40_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )

ABI40_0_0RCT_EXTERN_METHOD(
                  handleCardAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )

ABI40_0_0RCT_EXTERN_METHOD(
                  confirmPaymentMethod:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )
ABI40_0_0RCT_EXTERN_METHOD(configure3dSecure:(NSDictionary *)params)


ABI40_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI40_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI40_0_0RCTPromiseRejectBlock)reject
                  )


@end
