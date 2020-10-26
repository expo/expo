/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#pragma once
#import <memory>
#import "FlipperKitNetworkPlugin.h"
#import "SKDispatchQueue.h"

@interface FlipperKitNetworkPlugin (CPPInitialization)
- (instancetype)initWithNetworkAdapter:(id<SKNetworkAdapterDelegate>)adapter
                         dispatchQueue:
                             (std::shared_ptr<facebook::flipper::DispatchQueue>)
                                 queue;
@end
#endif
