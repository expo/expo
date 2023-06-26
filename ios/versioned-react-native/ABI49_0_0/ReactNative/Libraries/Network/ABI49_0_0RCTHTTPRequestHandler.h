/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTInvalidating.h>
#import <ABI49_0_0React/ABI49_0_0RCTURLRequestHandler.h>

typedef NSURLSessionConfiguration * (^NSURLSessionConfigurationProvider)(void);
/**
 *  The block provided via this function will provide the NSURLSessionConfiguration for all HTTP requests made by the
 * app.
 */
ABI49_0_0RCT_EXTERN void ABI49_0_0RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider);
/**
 * This is the default ABI49_0_0RCTURLRequestHandler implementation for HTTP requests.
 */
@interface ABI49_0_0RCTHTTPRequestHandler : NSObject <ABI49_0_0RCTURLRequestHandler, ABI49_0_0RCTInvalidating>

@end
