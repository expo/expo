/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Availability.h>
#import <AvailabilityInternal.h>
#import <objc/runtime.h>

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#define FLEXFloor(x) \
  (floor([[UIScreen mainScreen] scale] * (x)) / [[UIScreen mainScreen] scale])

#define FLEX_AT_LEAST_IOS11_SDK \
  defined(__IPHONE_11_0) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_11_0)

@interface NSNumber (SonarUtility)

+ (NSNumber*)random;

@end

@interface NSDate (SonarUtility)

+ (uint64_t)timestamp;
@end

@interface FLEXUtility : NSObject

// Swizzling utilities

+ (SEL)swizzledSelectorForSelector:(SEL)selector;
+ (BOOL)instanceRespondsButDoesNotImplementSelector:(SEL)selector
                                              class:(Class)cls;
+ (void)replaceImplementationOfKnownSelector:(SEL)originalSelector
                                     onClass:(Class)className
                                   withBlock:(id)block
                            swizzledSelector:(SEL)swizzledSelector;
+ (void)replaceImplementationOfSelector:(SEL)selector
                           withSelector:(SEL)swizzledSelector
                               forClass:(Class)cls
                  withMethodDescription:
                      (struct objc_method_description)methodDescription
                    implementationBlock:(id)implementationBlock
                         undefinedBlock:(id)undefinedBlock;

@end
