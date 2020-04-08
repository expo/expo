/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <SystemConfiguration/SystemConfiguration.h>

#import <ABI37_0_0React/ABI37_0_0RCTEventEmitter.h>

@interface ABI37_0_0RCTNetInfo : ABI37_0_0RCTEventEmitter

- (instancetype)initWithHost:(NSString *)host;

@end
