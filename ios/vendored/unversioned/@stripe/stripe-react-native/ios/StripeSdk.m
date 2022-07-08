#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(StripeSdk, RCTEventEmitter)


RCT_EXTERN_METHOD(
                  initialise:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  isApplePaySupported: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  createToken: (NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  presentApplePay:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  openApplePaySetup: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  updateApplePaySummaryItems:(NSArray *)summaryItems
                  errorAddressFields: (NSArray *)errorAddressFields
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  createTokenForCVCUpdate:(NSString *)cvc
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  handleURLCallback:(NSString *)url
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(
                  confirmApplePayPayment:(NSString *)clientSecret
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  createPaymentMethod:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  retrievePaymentIntent:(NSString *)clientSecret
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  retrieveSetupIntent:(NSString *)clientSecret
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  handleNextAction:(NSString *)paymentIntentClientSecret
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  initPaymentSheet:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  presentPaymentSheet:(RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  confirmPaymentSheetPayment:(RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  confirmPayment:(NSString *)paymentIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  confirmSetupIntent:(NSString *)setupIntentClientSecret
                  data:(NSDictionary *)data
                  options:(NSDictionary *)options
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  verifyMicrodeposits:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  collectBankAccount:(BOOL)isPaymentIntent
                  clientSecret:(NSString *)clientSecret
                  params:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )
RCT_EXTERN_METHOD(
                  isCardInWallet:(NSDictionary *)params
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

@end
