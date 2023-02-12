// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXStoreReview/ABI46_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI46_0_0EXStoreReviewModule

ABI46_0_0EX_EXPORT_MODULE(ExpoStoreReview);

ABI46_0_0EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI46_0_0EXPromiseResolveBlock)resolve
                            rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

ABI46_0_0EX_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI46_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI46_0_0EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
