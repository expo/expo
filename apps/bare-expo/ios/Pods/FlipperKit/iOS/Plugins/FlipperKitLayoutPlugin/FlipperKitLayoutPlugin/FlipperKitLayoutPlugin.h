/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <Foundation/Foundation.h>

#import <FlipperKit/FlipperPlugin.h>
#import <FlipperKit/SKMacros.h>

#import "SKDescriptorMapper.h"
#import "SKInvalidation.h"
#import "SKTapListener.h"

@interface FlipperKitLayoutPlugin
    : NSObject<FlipperPlugin, SKInvalidationDelegate>

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
            withDescriptorMapper:(SKDescriptorMapper*)mapper;

- (instancetype)initWithRootNode:(id<NSObject>)rootNode
                 withTapListener:(id<SKTapListener>)tapListener
            withDescriptorMapper:(SKDescriptorMapper*)mapper;

@property(nonatomic, readonly, strong) SKDescriptorMapper* descriptorMapper;

@end

/** Exposed for tests only. */
SK_EXTERN_C dispatch_queue_t SKLayoutPluginSerialBackgroundQueue(void);

#endif
