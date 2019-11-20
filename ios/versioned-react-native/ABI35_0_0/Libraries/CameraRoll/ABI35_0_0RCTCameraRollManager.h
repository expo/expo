/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Photos/Photos.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeModule.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>

@interface ABI35_0_0RCTConvert (PHFetchOptions)

+ (PHFetchOptions *)PHFetchOptionsFromMediaType:(NSString *)mediaType;

@end


@interface ABI35_0_0RCTCameraRollManager : NSObject <ABI35_0_0RCTBridgeModule>

@end
