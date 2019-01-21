/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeMethod.h>
#import <cxxReactABI32_0_0/ABI32_0_0CxxModule.h>

@interface ABI32_0_0RCTCxxMethod : NSObject <ABI32_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
