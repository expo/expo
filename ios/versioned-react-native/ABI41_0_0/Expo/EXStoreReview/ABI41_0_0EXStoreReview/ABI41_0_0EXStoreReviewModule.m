// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXStoreReview/ABI41_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI41_0_0EXStoreReviewModule

ABI41_0_0UM_EXPORT_MODULE(ExpoStoreReview);

ABI41_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                            rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

ABI41_0_0UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
