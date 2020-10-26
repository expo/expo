/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED
#import <Foundation/Foundation.h>

#import <FlipperKit/FlipperPlugin.h>

#import "SKBufferingPlugin.h"
#import "SKNetworkReporter.h"

@interface FlipperKitNetworkPlugin
    : SKBufferingPlugin<SKNetworkReporterDelegate>

- (instancetype)initWithNetworkAdapter:(id<SKNetworkAdapterDelegate>)adapter;
- (instancetype)initWithNetworkAdapter:(id<SKNetworkAdapterDelegate>)adapter
                                 queue:(dispatch_queue_t)
                                           queue; // For test purposes

@property(strong, nonatomic) id<SKNetworkAdapterDelegate> adapter;

@end

#endif
