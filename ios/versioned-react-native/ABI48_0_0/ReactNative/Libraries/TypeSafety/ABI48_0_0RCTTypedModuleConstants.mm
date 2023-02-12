/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTTypedModuleConstants.h"

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

@implementation _ABI48_0_0RCTTypedModuleConstants {
  NSDictionary *_dictionary;
}

+ (instancetype)newWithUnsafeDictionary:(NSDictionary<NSString *, id> *)dictionary
{
  _ABI48_0_0RCTTypedModuleConstants *constants = [self new];
  if (constants) {
    constants->_dictionary = dictionary;
  }
  return constants;
}

#pragma mark - NSDictionary subclass

// See subclassing notes in
// https://developer.apple.com/documentation/foundation/nsdictionary#//apple_ref/occ/cl/NSDictionary

ABI48_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithObjects
                    : (id _Nonnull const[])objects forKeys
                    : (id<NSCopying> _Nonnull const[])keys count
                    : (NSUInteger)count)

- (NSUInteger)count
{
  return [_dictionary count];
}

- (id)objectForKey:(id)key
{
  return [_dictionary objectForKey:key];
}

- (NSEnumerator *)keyEnumerator
{
  return [_dictionary keyEnumerator];
}

@end
