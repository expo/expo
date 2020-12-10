/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#define APPLY_ENUM_TO_YOGA_PROPERTY(varName, enumName)              \
  ^(NSString * newValue) {                                          \
    NSNumber* varName =                                             \
        [[enumName##EnumMap allKeysForObject:newValue] lastObject]; \
    if (varName == nil) {                                           \
      return;                                                       \
    }                                                               \
    node.yoga.varName = (enumName)[varName unsignedIntegerValue];   \
  }

#define APPLY_VALUE_TO_YGVALUE(varName)   \
  ^(NSNumber * value) {                   \
    YGValue newValue = node.yoga.varName; \
    newValue.value = [value floatValue];  \
    node.yoga.varName = newValue;         \
  }

#define APPLY_UNIT_TO_YGVALUE(varName, enumName)                 \
  ^(NSString * value) {                                          \
    NSNumber* varName =                                          \
        [[enumName##EnumMap allKeysForObject:value] lastObject]; \
    if (varName == nil) {                                        \
      return;                                                    \
    }                                                            \
    YGValue newValue = node.yoga.varName;                        \
    newValue.unit = (enumName)[varName unsignedIntegerValue];    \
    node.yoga.varName = newValue;                                \
  }
