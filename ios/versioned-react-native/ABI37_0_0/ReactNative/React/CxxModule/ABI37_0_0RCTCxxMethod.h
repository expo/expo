/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridgeMethod.h>
#import <ABI37_0_0cxxreact/ABI37_0_0CxxModule.h>

@interface ABI37_0_0RCTCxxMethod : NSObject <ABI37_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const ABI37_0_0facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
