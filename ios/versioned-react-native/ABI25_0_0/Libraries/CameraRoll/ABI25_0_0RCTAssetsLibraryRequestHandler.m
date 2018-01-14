/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTAssetsLibraryRequestHandler.h"

#import <stdatomic.h>

#import <AssetsLibrary/AssetsLibrary.h>
#import <MobileCoreServices/MobileCoreServices.h>

#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import <ReactABI25_0_0/ABI25_0_0RCTUtils.h>

@implementation ABI25_0_0RCTAssetsLibraryRequestHandler
{
  ALAssetsLibrary *_assetsLibrary;
}

ABI25_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (ALAssetsLibrary *)assetsLibrary
{
  return _assetsLibrary ?: (_assetsLibrary = [ALAssetsLibrary new]);
}

#pragma mark - ABI25_0_0RCTURLRequestHandler

- (BOOL)canHandleRequest:(NSURLRequest *)request
{
  return [request.URL.scheme caseInsensitiveCompare:@"assets-library"] == NSOrderedSame;
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<ABI25_0_0RCTURLRequestDelegate>)delegate
{
  __block atomic_bool cancelled = ATOMIC_VAR_INIT(NO);
  void (^cancellationBlock)(void) = ^{
    atomic_store(&cancelled, YES);
  };

  [[self assetsLibrary] assetForURL:request.URL resultBlock:^(ALAsset *asset) {
    if (atomic_load(&cancelled)) {
      return;
    }

    if (asset) {

      ALAssetRepresentation *representation = [asset defaultRepresentation];
      NSInteger length = (NSInteger)representation.size;
      CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(representation.UTI), kUTTagClassMIMEType);

      NSURLResponse *response =
      [[NSURLResponse alloc] initWithURL:request.URL
                                MIMEType:(__bridge NSString *)(MIMEType)
                   expectedContentLength:length
                        textEncodingName:nil];

      [delegate URLRequest:cancellationBlock didReceiveResponse:response];

      NSError *error = nil;
      uint8_t *buffer = (uint8_t *)malloc((size_t)length);
      if ([representation getBytes:buffer
                        fromOffset:0
                            length:length
                             error:&error]) {

        NSData *data = [[NSData alloc] initWithBytesNoCopy:buffer
                                                    length:length
                                              freeWhenDone:YES];

        [delegate URLRequest:cancellationBlock didReceiveData:data];
        [delegate URLRequest:cancellationBlock didCompleteWithError:nil];

      } else {
        free(buffer);
        [delegate URLRequest:cancellationBlock didCompleteWithError:error];
      }

    } else {
      NSString *errorMessage = [NSString stringWithFormat:@"Failed to load asset"
                                " at URL %@ with no error message.", request.URL];
      NSError *error = ABI25_0_0RCTErrorWithMessage(errorMessage);
      [delegate URLRequest:cancellationBlock didCompleteWithError:error];
    }
  } failureBlock:^(NSError *loadError) {
    if (atomic_load(&cancelled)) {
      return;
    }
    [delegate URLRequest:cancellationBlock didCompleteWithError:loadError];
  }];

  return cancellationBlock;
}

- (void)cancelRequest:(id)requestToken
{
  ((void (^)(void))requestToken)();
}

@end

@implementation ABI25_0_0RCTBridge (ABI25_0_0RCTAssetsLibraryImageLoader)

- (ALAssetsLibrary *)assetsLibrary
{
  return [[self moduleForClass:[ABI25_0_0RCTAssetsLibraryRequestHandler class]] assetsLibrary];
}

@end
