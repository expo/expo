/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI39_0_0React/ABI39_0_0RCTBridgeMethod.h>
#import <ABI39_0_0cxxreact/ABI39_0_0CxxModule.h>

@interface ABI39_0_0RCTCxxMethod : NSObject <ABI39_0_0RCTBridgeMethod>

- (instancetype)initWithCxxMethod:(const ABI39_0_0facebook::xplat::module::CxxModule::Method &)cxxMethod;

@end
