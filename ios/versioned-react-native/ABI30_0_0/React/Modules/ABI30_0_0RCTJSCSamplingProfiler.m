/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTJSCSamplingProfiler.h"

#import "ABI30_0_0RCTBridge.h"
#import "ABI30_0_0RCTLog.h"

@implementation ABI30_0_0RCTJSCSamplingProfiler

@synthesize methodQueue = _methodQueue;
@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE(ABI30_0_0RCTJSCSamplingProfiler);

#ifdef ABI30_0_0RCT_PROFILE
ABI30_0_0RCT_EXPORT_METHOD(operationComplete:(__unused int)token result:(id)profileData error:(id)error)
{
  if (error) {
    ABI30_0_0RCTLogError(@"JSC Sampling profiler ended with error: %@", error);
    return;
  }

  // Create a POST request with all of the datas
  NSURL *url = [NSURL URLWithString:@"/jsc-profile" relativeToURL:self.bridge.bundleURL];
  NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url
                                                         cachePolicy:NSURLRequestReloadIgnoringLocalAndRemoteCacheData
                                                     timeoutInterval:60];
  [request setHTTPMethod:@"POST"];
  [request setHTTPBody:[profileData dataUsingEncoding:NSUTF8StringEncoding]];

  // Send the request
  NSURLSession *session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]];
  NSURLSessionDataTask *sessionDataTask = [session dataTaskWithRequest:request completionHandler:^(__unused NSData *data, __unused NSURLResponse *response, NSError *sessionError) {
    if (sessionError) {
      ABI30_0_0RCTLogWarn(@"JS CPU Profile data failed to send. Is the packager server running locally?\nDetails: %@", error);
    } else {
      ABI30_0_0RCTLogInfo(@"JS CPU Profile data sent successfully.");
    }
  }];

  [sessionDataTask resume];
}

- (void)operationCompletedWithResults:(NSString *)results
{
  // Send the results to the packager, using the module's queue.
  dispatch_async(self.methodQueue, ^{
    [self operationComplete:0 result:results error:nil];
  });
}

#endif

@end
