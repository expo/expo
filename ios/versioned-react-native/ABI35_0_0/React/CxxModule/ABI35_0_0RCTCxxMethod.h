/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI35_0_0/ABI35_0_0RCTBridgeMethod.h>
#import <cxxReactABI35_0_0/ABI35_0_0CxxModule.h>

@interface ABI35_0_0RCTCxxMethod : NSObject <ABI35_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const ABI35_0_0facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
