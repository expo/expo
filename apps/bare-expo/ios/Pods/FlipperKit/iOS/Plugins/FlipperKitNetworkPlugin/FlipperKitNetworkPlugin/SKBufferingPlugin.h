/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import <Foundation/Foundation.h>

#import <FlipperKit/FlipperPlugin.h>

@interface SKBufferingPlugin : NSObject<FlipperPlugin>

- (instancetype)initWithQueue:(dispatch_queue_t)queue;

- (void)send:(NSString*)method
    sonarObject:(NSDictionary<NSString*, id>*)sonarObject;

@end

#endif
