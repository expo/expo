// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXStoreReview/ABI37_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI37_0_0EXStoreReviewModule

ABI37_0_0UM_EXPORT_MODULE(ExpoStoreReview);

ABI37_0_0UM_EXPORT_METHOD_AS(isAvailableAsync,
                    isAvailableAsync:(ABI37_0_0UMPromiseResolveBlock)resolve
                            rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  if (@available(iOS 10.3, *)) {
    BOOL isAvailable = [SKStoreReviewController class] ? YES : NO;
    
    resolve(@(isAvailable));
  } else {
    resolve(@(NO));
  }
}

ABI37_0_0UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
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
