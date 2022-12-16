/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI45_0_0React/ABI45_0_0RCTBridgeMethod.h>
#import <ABI45_0_0cxxreact/ABI45_0_0CxxModule.h>

@interface ABI45_0_0RCTCxxMethod : NSObject <ABI45_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const ABI45_0_0facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
