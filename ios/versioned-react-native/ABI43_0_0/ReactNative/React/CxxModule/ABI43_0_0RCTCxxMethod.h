/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI43_0_0React/ABI43_0_0RCTBridgeMethod.h>
#import <ABI43_0_0cxxreact/ABI43_0_0CxxModule.h>

@interface ABI43_0_0RCTCxxMethod : NSObject <ABI43_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const ABI43_0_0facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
