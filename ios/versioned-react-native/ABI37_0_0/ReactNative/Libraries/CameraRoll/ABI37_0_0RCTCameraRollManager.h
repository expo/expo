/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Photos/Photos.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeModule.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>

@interface ABI37_0_0RCTConvert (PHFetchOptions)

+ (PHFetchOptions *)PHFetchOptionsFromMediaType:(NSString *)mediaType;

@end


@interface ABI37_0_0RCTCameraRollManager : NSObject <ABI37_0_0RCTBridgeModule>

@end
