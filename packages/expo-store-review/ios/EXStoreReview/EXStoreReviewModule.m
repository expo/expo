// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXStoreReview/EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation EXStoreReviewModule

EX_EXPORT_MODULE(ExpoStoreReview);

EX_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(EXPromiseResolveBlock)resolve
                            rejecter:(EXPromiseRejectBlock)reject)
{
  BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
  resolve(@(isAvailable));
}

EX_EXPORT_METHOD_AS(requestReview,
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [SKStoreReviewController requestReview];
    resolve(nil);
  });
}

@end
