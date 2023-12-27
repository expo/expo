// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXStoreReview/ABI43_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI43_0_0EXStoreReviewModule

ABI43_0_0EX_EXPORT_MODULE(ExpoStoreReview);

ABI43_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                            rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
