// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXStoreReview/ABI35_0_0EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation ABI35_0_0EXStoreReviewModule

ABI35_0_0UM_EXPORT_MODULE(ExpoStoreReview);

- (NSDictionary *)constantsToExport
{
  BOOL isSupported;
  if (@available(iOS 10.3, *)) {
    isSupported = [SKStoreReviewController class] ? YES : NO;
  } else {
    isSupported = NO;
  }
  return @{ @"isSupported": @(isSupported) };
}

ABI35_0_0UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(ABI35_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI35_0_0UMPromiseRejectBlock)reject)
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
