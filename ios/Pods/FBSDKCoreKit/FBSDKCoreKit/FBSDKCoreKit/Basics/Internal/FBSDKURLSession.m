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

#import "FBSDKURLSession.h"

#import "FBSDKBasicUtility.h"
#import "FBSDKURLSessionTask.h"

@implementation FBSDKURLSession

- (instancetype)initWithDelegate:(id<NSURLSessionDataDelegate>)delegate
                   delegateQueue:(NSOperationQueue *)queue
{
  if ((self = [super init])) {
    self.delegate = delegate;
    self.delegateQueue = queue;
  }
  return self;
}

- (void)executeURLRequest:(NSURLRequest *)request
        completionHandler:(FBSDKURLSessionTaskBlock)handler
{
  if (!self.valid) {
    [self updateSessionWithBlock:^{
      FBSDKURLSessionTask *task = [[FBSDKURLSessionTask alloc] initWithRequest:request fromSession:self.session completionHandler:handler];
      [task start];
    }];
  } else {
    FBSDKURLSessionTask *task = [[FBSDKURLSessionTask alloc] initWithRequest:request fromSession:self.session completionHandler:handler];
    [task start];
  }
}

- (void)updateSessionWithBlock:(dispatch_block_t)block
{
  if (!self.valid) {
    self.session = [NSURLSession sessionWithConfiguration:[NSURLSessionConfiguration defaultSessionConfiguration]
                                                 delegate:_delegate
                                            delegateQueue:_delegateQueue];
  }
  block();
}

- (void)invalidateAndCancel
{
  [self.session invalidateAndCancel];
  self.session = nil;
}

- (BOOL)valid
{
  return self.session != nil;
}

@end
