/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <AssetsLibrary/AssetsLibrary.h>

#import "ABI12_0_0RCTBridgeModule.h"
#import "ABI12_0_0RCTConvert.h"

@interface ABI12_0_0RCTConvert (ALAssetGroup)

+ (ALAssetsGroupType)ALAssetsGroupType:(id)json;
+ (ALAssetsFilter *)ALAssetsFilter:(id)json;

@end

@interface ABI12_0_0RCTCameraRollManager : NSObject <ABI12_0_0RCTBridgeModule>

@end
