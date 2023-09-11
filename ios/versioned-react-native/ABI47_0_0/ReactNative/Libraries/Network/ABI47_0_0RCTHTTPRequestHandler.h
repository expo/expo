/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI47_0_0React/ABI47_0_0RCTInvalidating.h>
#import <ABI47_0_0React/ABI47_0_0RCTURLRequestHandler.h>

typedef NSURLSessionConfiguration* (^NSURLSessionConfigurationProvider)(void);
/**
 *  The block provided via this function will provide the NSURLSessionConfiguration for all HTTP requests made by the app.
*/
ABI47_0_0RCT_EXTERN void ABI47_0_0RCTSetCustomNSURLSessionConfigurationProvider(NSURLSessionConfigurationProvider);
/**
 * This is the default ABI47_0_0RCTURLRequestHandler implementation for HTTP requests.
 */
@interface ABI47_0_0RCTHTTPRequestHandler : NSObject <ABI47_0_0RCTURLRequestHandler, ABI47_0_0RCTInvalidating>

@end
