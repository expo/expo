// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKURLSessionTask.h"

#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKMacros.h"
#import "FBSDKSettings.h"

@interface FBSDKURLSessionTask ()

@property (nonatomic, strong) NSURLSessionTask *task;
@property (nonatomic, copy) FBSDKURLSessionTaskHandler handler;
@property (nonatomic, assign) uint64_t requestStartTime;
@property (nonatomic, assign, readonly) NSUInteger loggerSerialNumber;

@end

@implementation FBSDKURLSessionTask

- (FBSDKURLSessionTask *)initWithRequest:(NSURLRequest *)request
                             fromSession:(NSURLSession *)session
                       completionHandler:(FBSDKURLSessionTaskHandler)handler
{
  if ((self = [super init])) {
    _requestStartTime = [FBSDKInternalUtility currentTimeInMilliseconds];
    _loggerSerialNumber = [FBSDKLogger generateSerialNumber];
    _handler = [handler copy];
    __weak FBSDKURLSessionTask *weakSelf = self;
    _task = [session dataTaskWithRequest:request
                       completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
                         if (error) {
                           [weakSelf taskDidCompleteWithError:error];
                         } else {
                           [weakSelf taskDidCompleteWithResponse:response data:data];
                         }
                       }];
  }
  return self;
}

- (FBSDKURLSessionTask *)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithRequest:fromSession:completionHandler:);
  return [self initWithRequest:nil
                   fromSession:nil
             completionHandler:NULL];
}

#pragma mark - Logging and Completion

- (void)logAndInvokeHandler:(FBSDKURLSessionTaskHandler)handler
                      error:(NSError *)error {
  if (error) {
    NSString *logEntry = [NSString
                          stringWithFormat:@"FBSDKURLSessionTask <#%lu>:\n  Error: '%@'\n%@\n",
                          (unsigned long)self.loggerSerialNumber,
                          [error localizedDescription],
                          [error userInfo]];

    [self logMessage:logEntry];
  }

  [self invokeHandler:handler error:error response:nil responseData:nil];
}

- (void)logAndInvokeHandler:(FBSDKURLSessionTaskHandler)handler
                   response:(NSURLResponse *)response
               responseData:(NSData *)responseData {
  // Basic FBSDKURLSessionTask logging just prints out the URL.  FBSDKGraphRequest logging provides more details.
  NSString *mimeType = [response MIMEType];
  NSMutableString *mutableLogEntry = [NSMutableString stringWithFormat:@"FBSDKURLSessionTask <#%lu>:\n  Duration: %llu msec\nResponse Size: %lu kB\n  MIME type: %@\n",
                                      (unsigned long)self.loggerSerialNumber,
                                      [FBSDKInternalUtility currentTimeInMilliseconds] - self.requestStartTime,
                                      (unsigned long)[responseData length] / 1024,
                                      mimeType];

  if ([mimeType isEqualToString:@"text/javascript"]) {
    NSString *responseUTF8 = [[NSString alloc] initWithData:responseData encoding:NSUTF8StringEncoding];
    [mutableLogEntry appendFormat:@"  Response:\n%@\n\n", responseUTF8];
  }

  [self logMessage:mutableLogEntry];

  [self invokeHandler:handler error:nil response:response responseData:responseData];
}

- (void)invokeHandler:(FBSDKURLSessionTaskHandler)handler
                error:(NSError *)error
             response:(NSURLResponse *)response
         responseData:(NSData *)responseData {
  if (handler != nil) {
    dispatch_async(dispatch_get_main_queue(), ^{
      handler(error, response, responseData);
    });
  }
}

- (void)logMessage:(NSString *)message
{
  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorNetworkRequests formatString:@"%@", message];
}

- (void)taskDidCompleteWithResponse:(NSURLResponse *)response data:(NSData *)data
{
  @try {
    [self logAndInvokeHandler:self.handler response:response responseData:data];
  } @finally {
    self.handler = nil;
  }
}

- (void)taskDidCompleteWithError:(NSError *)error
{
  @try {
    if ([error.domain isEqualToString:NSURLErrorDomain] && error.code == kCFURLErrorSecureConnectionFailed) {
      NSOperatingSystemVersion iOS9Version = { .majorVersion = 9, .minorVersion = 0, .patchVersion = 0 };
      if ([FBSDKInternalUtility isOSRunTimeVersionAtLeast:iOS9Version]) {
        [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors
                               logEntry:@"WARNING: FBSDK secure network request failed. Please verify you have configured your "
         "app for Application Transport Security compatibility described at https://developers.facebook.com/docs/ios/ios9"];
      }
    }
    [self logAndInvokeHandler:self.handler error:error];
  } @finally {
    self.handler = nil;
  }
}

#pragma mark - Task State

- (void)start
{
  [self.task resume];
}

- (void)cancel
{
  [self.task cancel];
  self.handler = nil;
}

@end
