/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

typedef void (^ABI49_0_0RCTMultipartCallback)(NSDictionary *headers, NSData *content, BOOL done);
typedef void (^ABI49_0_0RCTMultipartProgressCallback)(NSDictionary *headers, NSNumber *loaded, NSNumber *total);

// ABI49_0_0RCTMultipartStreamReader can be used to parse responses with Content-Type: multipart/mixed
// See https://www.w3.org/Protocols/rfc1341/7_2_Multipart.html
@interface ABI49_0_0RCTMultipartStreamReader : NSObject

- (instancetype)initWithInputStream:(NSInputStream *)stream boundary:(NSString *)boundary;
- (BOOL)readAllPartsWithCompletionCallback:(ABI49_0_0RCTMultipartCallback)callback
                          progressCallback:(ABI49_0_0RCTMultipartProgressCallback)progressCallback;

@end
