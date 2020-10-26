/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#define FBPFTrace(...) /*NSLog(__VA_ARGS__)*/
#define FBPFLog(...) NSLog(__VA_ARGS__)

enum {
  FKPortForwardingFrameTypeOpenPipe = 201,
  FKPortForwardingFrameTypeWriteToPipe = 202,
  FKPortForwardingFrameTypeClosePipe = 203,
};

static dispatch_data_t NSDataToGCDData(NSData* data) {
  __block NSData* retainedData = data;
  return dispatch_data_create(data.bytes, data.length, nil, ^{
    retainedData = nil;
  });
}
