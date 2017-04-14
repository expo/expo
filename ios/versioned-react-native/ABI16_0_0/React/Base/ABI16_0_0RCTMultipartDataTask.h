/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import <ReactABI16_0_0/ABI16_0_0RCTMultipartStreamReader.h>

typedef void (^ABI16_0_0RCTMultipartDataTaskCallback)(NSInteger statusCode, NSDictionary *headers, NSData *content, NSError *error, BOOL done);

@interface ABI16_0_0RCTMultipartDataTask : NSObject

- (instancetype)initWithURL:(NSURL *)url partHandler:(ABI16_0_0RCTMultipartDataTaskCallback)partHandler;
- (void)startTask;

@end
