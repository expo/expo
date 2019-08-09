// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXStoreReview/EXStoreReviewModule.h>
#import <StoreKit/SKStoreReviewController.h>

@implementation EXStoreReviewModule

UM_EXPORT_MODULE(ExpoStoreReview);

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

UM_EXPORT_METHOD_AS(requestReview,
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  if (@available(iOS 10.3, *)) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [SKStoreReviewController requestReview];
    });
    resolve(nil);
  } else {
    reject(@"E_STORE_REVIEW_UNSUPPORTED", @"Store review is not supported.", nil);
  }
}

@end
