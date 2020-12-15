// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXStoreReview/EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation EXStoreReviewModule

UM_EXPORT_MODULE(ExpoStoreReview);

UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(UMPromiseResolveBlock)resolve
                            rejecter:(UMPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
