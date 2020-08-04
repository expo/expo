/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI38_0_0React/ABI38_0_0RCTMultipartStreamReader.h>

typedef void (^ABI38_0_0RCTMultipartDataTaskCallback)(NSInteger statusCode, NSDictionary *headers, NSData *content, NSError *error, BOOL done);

@interface ABI38_0_0RCTMultipartDataTask : NSObject

- (instancetype)initWithURL:(NSURL *)url
                partHandler:(ABI38_0_0RCTMultipartDataTaskCallback)partHandler
            progressHandler:(ABI38_0_0RCTMultipartProgressCallback)progressHandler;

- (void)startTask;

@end
