// Copyright 2015-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXNetworkReporterBodyStore.h>
#import <React/RCTInspectorNetworkReporter.h>

@implementation EXNetworkReporterBodyStore

+ (void)storeTextResponseBody:(NSString *)text forRequestId:(NSString *)requestId
{
  // The string branch stores under the core reporter's lock. The incremental variant buffers in a
  // process-wide dictionary that `RCTNetworking` appends to on its own queue without one.
  [RCTInspectorNetworkReporter maybeStoreResponseBody:requestId data:(id)text base64Encoded:NO];
}

@end
