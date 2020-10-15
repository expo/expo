/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol SKInvalidationDelegate

- (void)invalidateNode:(id<NSObject>)node;
- (void)updateNodeReference:(id<NSObject>)node;

@end

@interface SKInvalidation : NSObject

+ (instancetype)sharedInstance;

+ (void)enableInvalidations;

@property(nonatomic, weak) id<SKInvalidationDelegate> delegate;

@end
