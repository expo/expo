/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>
#import <ReactABI27_0_0/ABI27_0_0RCTURLRequestHandler.h>

@class ALAssetsLibrary;

@interface ABI27_0_0RCTAssetsLibraryRequestHandler : NSObject <ABI27_0_0RCTURLRequestHandler>

@end

@interface ABI27_0_0RCTBridge (ABI27_0_0RCTAssetsLibraryImageLoader)

/**
 * The shared asset library instance.
 */
@property (nonatomic, readonly) ALAssetsLibrary *assetsLibrary;

@end
