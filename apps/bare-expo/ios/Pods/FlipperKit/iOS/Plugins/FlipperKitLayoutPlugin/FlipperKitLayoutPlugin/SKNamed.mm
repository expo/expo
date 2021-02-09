/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKNamed.h"

@implementation SKNamed

+ (instancetype)newWithName:(NSString*)name withValue:(id)value {
  return [[SKNamed alloc] initWithName:name withValue:value];
}

- (instancetype)initWithName:(NSString*)name withValue:(id)value {
  if (self = [super init]) {
    _name = name;
    _value = value;
  }

  return self;
}

- (NSString*)description {
  return [NSString stringWithFormat:@"%@: %@", _name, _value];
}

@end

#endif
