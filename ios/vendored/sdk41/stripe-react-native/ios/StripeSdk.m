#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventEmitter.h>

@interface ABI41_0_0RCT_EXTERN_REMAP_MODULE(StripeSdk, ABI41_0_0StripeSdk, ABI41_0_0RCTEventEmitter)


ABI41_0_0RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  isApplePaySupported: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject)

ABI41_0_0RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject)

ABI41_0_0RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject)

ABI41_0_0RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject)

ABI41_0_0RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject)

ABI41_0_0RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  handleCardAction:(NSString *)paymentIntentClientSecret
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  presentPaymentSheet:(NSDictionary)params
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )

ABI41_0_0RCT_EXTERN_METHOD(
                  confirmPaymentMethod:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )
ABI41_0_0RCT_EXTERN_METHOD(configure3dSecure:(NSDictionary *)params)


ABI41_0_0RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (ABI41_0_0RCTPromiseResolveBlock)resolve
                  rejecter: (ABI41_0_0RCTPromiseRejectBlock)reject
                  )


@end
