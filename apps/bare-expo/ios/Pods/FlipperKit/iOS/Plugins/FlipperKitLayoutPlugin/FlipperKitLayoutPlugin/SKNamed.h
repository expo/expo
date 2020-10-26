/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface SKNamed<__covariant T> : NSObject

+ (instancetype)newWithName:(NSString*)name withValue:(T)value;

@property(nonatomic, readonly) NSString* name;
@property(nonatomic, readonly) T value;

@end
