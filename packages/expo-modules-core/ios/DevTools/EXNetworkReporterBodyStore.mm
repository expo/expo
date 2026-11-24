// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXNetworkReporterBodyStore.h>
#import <React/RCTInspectorNetworkReporter.h>

@implementation EXNetworkReporterBodyStore

+ (void)storeTextResponseBody:(NSString *)text forRequestId:(NSString *)requestId
{
  // TODO: Remove this helper and call `maybeStoreResponseBody:body:` from Swift once the minimum
  // React Native version includes it: https://github.com/react/react-native/pull/60188
  [RCTInspectorNetworkReporter maybeStoreResponseBody:requestId data:(id)text base64Encoded:NO];
}

@end
