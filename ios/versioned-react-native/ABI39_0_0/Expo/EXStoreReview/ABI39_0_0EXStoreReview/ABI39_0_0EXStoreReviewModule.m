// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXStoreReview/ABI39_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI39_0_0EXStoreReviewModule

ABI39_0_0UM_EXPORT_MODULE(ExpoStoreReview);

ABI39_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI39_0_0UMPromiseResolveBlock)resolve
                            rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  if (@available(iOS 10.3, *)) {
    BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
    
    resolve(@(isAvailable));
  } else {
    resolve(@(NO));
  }
}

ABI39_0_0UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  if (@available(iOS 10.3, *)) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [SKStoreReviewController requestReview];
      resolve(nil);
    });
  } else {
    reject(@"E_STORE_REVIEW_UNSUPPORTED", @"Store review is not supported.", nil);
  }
}

@end
