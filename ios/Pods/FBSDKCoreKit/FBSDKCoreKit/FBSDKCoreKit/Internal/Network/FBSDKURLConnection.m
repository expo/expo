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

#import "FBSDKURLConnection.h"

#import "FBSDKInternalUtility.h"
#import "FBSDKLogger.h"
#import "FBSDKMacros.h"
#import "FBSDKSettings.h"

@interface FBSDKURLConnection () <NSURLConnectionDataDelegate>

@property (nonatomic, retain) NSURLConnection *connection;
@property (nonatomic, retain) NSMutableData *data;
@property (nonatomic, copy) FBSDKURLConnectionHandler handler;
@property (nonatomic, retain) NSURLResponse *response;
@property (nonatomic, assign) uint64_t requestStartTime;
@property (nonatomic, readonly) NSUInteger loggerSerialNumber;

@end

@implementation FBSDKURLConnection

#pragma mark - Lifecycle

- (FBSDKURLConnection *)initWithRequest:(NSURLRequest *)request
                      completionHandler:(FBSDKURLConnectionHandler)handler {
  if ((self = [super init])) {
      _requestStartTime = [FBSDKInternalUtility currentTimeInMilliseconds];
      _loggerSerialNumber = [FBSDKLogger generateSerialNumber];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
      _connection = [[NSURLConnection alloc]
                     initWithRequest:request
                     delegate:self
                     startImmediately:NO];
#pragma clang diagnostic pop
      _data = [[NSMutableData alloc] init];

      _handler = [handler copy];
  }
  return self;
}

- (instancetype)init
{
  FBSDK_NOT_DESIGNATED_INITIALIZER(initWithRequest:completionHandler:);
  return [self initWithRequest:nil completionHandler:NULL];
}

- (void)logAndInvokeHandler:(FBSDKURLConnectionHandler)handler
                      error:(NSError *)error {
  if (error) {
    NSString *logEntry = [NSString
                          stringWithFormat:@"FBSDKURLConnection <#%lu>:\n  Error: '%@'\n%@\n",
                          (unsigned long)self.loggerSerialNumber,
                          [error localizedDescription],
                          [error userInfo]];

    [self logMessage:logEntry];
  }

  [self invokeHandler:handler error:error response:nil responseData:nil];
}

- (void)logAndInvokeHandler:(FBSDKURLConnectionHandler)handler
                   response:(NSURLResponse *)response
               responseData:(NSData *)responseData {
  // Basic FBSDKURLConnection logging just prints out the URL.  FBSDKGraphRequest logging provides more details.
  NSString *mimeType = [response MIMEType];
  NSMutableString *mutableLogEntry = [NSMutableString stringWithFormat:@"FBSDKURLConnection <#%lu>:\n  Duration: %llu msec\nResponse Size: %lu kB\n  MIME type: %@\n",
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

- (void)invokeHandler:(FBSDKURLConnectionHandler)handler
                error:(NSError *)error
             response:(NSURLResponse *)response
         responseData:(NSData *)responseData {
  if (handler != nil) {
    handler(self, error, response, responseData);
  }
}

- (void)logMessage:(NSString *)message
{
  [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorNetworkRequests formatString:@"%@", message];
}

- (void)cancel
{
  [self.connection cancel];
  self.handler = nil;
}

- (void)connection:(NSURLConnection *)connection
didReceiveResponse:(NSURLResponse *)response
{
  self.response = response;
  [self.data setLength:0];
}

- (void)connection:(NSURLResponse *)connection
    didReceiveData:(NSData *)data {
  [self.data appendData:data];
}

- (void)connection:(NSURLConnection *)connection
  didFailWithError:(NSError *)error {
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

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
  @try {
    [self logAndInvokeHandler:self.handler response:self.response responseData:self.data];
  } @finally {
    self.handler = nil;
  }
}

- (NSURLRequest *)connection:(NSURLConnection *)connection
             willSendRequest:(NSURLRequest *)request
            redirectResponse:(NSURLResponse *)redirectResponse {
  return request;
}

- (void)       connection:(NSURLConnection *)connection
          didSendBodyData:(NSInteger)bytesWritten
        totalBytesWritten:(NSInteger)totalBytesWritten
totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite
{
  id<FBSDKURLConnectionDelegate> delegate = self.delegate;

  if ([delegate respondsToSelector:@selector(facebookURLConnection:didSendBodyData:totalBytesWritten:totalBytesExpectedToWrite:)]) {
    [delegate facebookURLConnection:self
                    didSendBodyData:bytesWritten
                  totalBytesWritten:totalBytesWritten
          totalBytesExpectedToWrite:totalBytesExpectedToWrite];
  }
}

- (void)start
{
  [_connection start];
}

- (void)setDelegateQueue:(NSOperationQueue*)queue
{
  [_connection setDelegateQueue:queue];
}

@end
