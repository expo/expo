// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXStoreReview/ABI44_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI44_0_0EXStoreReviewModule

ABI44_0_0EX_EXPORT_MODULE(ExpoStoreReview);

ABI44_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                            rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

ABI44_0_0EX_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
