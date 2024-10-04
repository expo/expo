/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTDataRequestHandler.h>
#import <ABI47_0_0ReactCommon/ABI47_0_0RCTTurboModule.h>

#import "ABI47_0_0RCTNetworkPlugins.h"

@interface ABI47_0_0RCTDataRequestHandler() <ABI47_0_0RCTTurboModule>
@end

@implementation ABI47_0_0RCTDataRequestHandler
{
  NSOperationQueue *_queue;
}

ABI47_0_0RCT_EXPORT_MODULE()

- (void)invalidate
{
  [_queue cancelAllOperations];
  _queue = nil;
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:@"data"] == NSOrderedSame;
}

- (NSOperation *)sendRequest:(NSURLRequest *)request
                withDelegate:(id<ABI47_0_0RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_queue) {
    _queue = [NSOperationQueue new];
    _queue.maxConcurrentOperationCount = 2;
  }

  __weak __block NSBlockOperation *weakOp;
  __block NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{

    // Get mime type
    NSRange firstSemicolon = [request.URL.resourceSpecifier rangeOfString:@";"];
    NSString *mimeType = firstSemicolon.length ? [request.URL.resourceSpecifier substringToIndex:firstSemicolon.location] : nil;

    // Send response
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:mimeType
                                           expectedContentLength:-1
                                                textEncodingName:nil];

    [delegate URLRequest:weakOp didReceiveResponse:response];

    // Load data
    NSError *error;
    NSData *data = [NSData dataWithContentsOfURL:request.URL
                                         options:NSDataReadingMappedIfSafe
                                           error:&error];
    if (data) {
      [delegate URLRequest:weakOp didReceiveData:data];
    }
    [delegate URLRequest:weakOp didCompleteWithError:error];
  }];

  weakOp = op;
  [_queue addOperation:op];
  return op;
}

- (void)cancelRequest:(NSOperation *)op
{
  [op cancel];
}

- (std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::TurboModule>)getTurboModule:
    (const ABI47_0_0facebook::ABI47_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class ABI47_0_0RCTDataRequestHandlerCls(void) {
  return ABI47_0_0RCTDataRequestHandler.class;
}
