/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTFileRequestHandler.h>

#import <MobileCoreServices/MobileCoreServices.h>

#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModule.h>

#import "ABI48_0_0RCTNetworkPlugins.h"

@interface ABI48_0_0RCTFileRequestHandler () <ABI48_0_0RCTTurboModule>
@end

@implementation ABI48_0_0RCTFileRequestHandler {
  NSOperationQueue *_fileQueue;
}

ABI48_0_0RCT_EXPORT_MODULE()

- (void)invalidate
{
  [_fileQueue cancelAllOperations];
  _fileQueue = nil;
}

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:@"file"] == NSOrderedSame && !ABI48_0_0RCTIsBundleAssetURL(request.URL);
}

- (NSOperation *)sendRequest:(NSURLRequest *)request withDelegate:(id<ABI48_0_0RCTURLRequestDelegate>)delegate
{
  // Lazy setup
  if (!_fileQueue) {
    _fileQueue = [NSOperationQueue new];
    _fileQueue.maxConcurrentOperationCount = 4;
  }

  __weak __block NSBlockOperation *weakOp;
  __block NSBlockOperation *op = [NSBlockOperation blockOperationWithBlock:^{
    // Get content length
    NSError *error = nil;
    NSFileManager *fileManager = [NSFileManager new];
    NSDictionary<NSString *, id> *fileAttributes = [fileManager attributesOfItemAtPath:request.URL.path error:&error];
    if (!fileAttributes) {
      [delegate URLRequest:weakOp didCompleteWithError:error];
      return;
    }

    // Get mime type
    NSString *fileExtension = [request.URL pathExtension];
    NSString *UTI = (__bridge_transfer NSString *)UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassFilenameExtension, (__bridge CFStringRef)fileExtension, NULL);
    NSString *contentType =
        (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass((__bridge CFStringRef)UTI, kUTTagClassMIMEType);

    // Send response
    NSURLResponse *response = [[NSURLResponse alloc] initWithURL:request.URL
                                                        MIMEType:contentType
                                           expectedContentLength:[fileAttributes[NSFileSize] ?: @-1 integerValue]
                                                textEncodingName:nil];

    [delegate URLRequest:weakOp didReceiveResponse:response];

    // Load data
    NSData *data = [NSData dataWithContentsOfURL:request.URL options:NSDataReadingMappedIfSafe error:&error];
    if (data) {
      [delegate URLRequest:weakOp didReceiveData:data];
    }
    [delegate URLRequest:weakOp didCompleteWithError:error];
  }];

  weakOp = op;
  [_fileQueue addOperation:op];
  return op;
}

- (void)cancelRequest:(NSOperation *)op
{
  [op cancel];
}

- (std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::TurboModule>)getTurboModule:
    (const ABI48_0_0facebook::ABI48_0_0React::ObjCTurboModule::InitParams &)params
{
  return nullptr;
}

@end

Class ABI48_0_0RCTFileRequestHandlerCls(void)
{
  return ABI48_0_0RCTFileRequestHandler.class;
}
