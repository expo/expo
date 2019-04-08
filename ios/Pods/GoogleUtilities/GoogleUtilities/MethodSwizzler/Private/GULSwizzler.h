/*
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/** This class handles the runtime manipulation necessary to instrument selectors. It stores the
 *  classes and selectors that have been swizzled, and runs all operations on its own queue.
 */
@interface GULSwizzler : NSObject

/** Manipulates the Objective-C runtime to replace the original IMP with the supplied block.
 *
 *  @param aClass The class to swizzle.
 *  @param selector The selector of the class to swizzle.
 *  @param isClassSelector A BOOL specifying whether the selector is a class or instance selector.
 *  @param block The block that replaces the original IMP.
 */
+ (void)swizzleClass:(Class)aClass
            selector:(SEL)selector
     isClassSelector:(BOOL)isClassSelector
           withBlock:(nullable id)block;

/** Restores the original implementation.
 *
 *  @param aClass The class to unswizzle.
 *  @param selector The selector to restore the original implementation of.
 *  @param isClassSelector A BOOL specifying whether the selector is a class or instance selector.
 */
+ (void)unswizzleClass:(Class)aClass selector:(SEL)selector isClassSelector:(BOOL)isClassSelector;

/** Returns the current IMP for the given class and selector.
 *
 *  @param aClass The class to use.
 *  @param selector The selector to find the implementation of.
 *  @param isClassSelector A BOOL specifying whether the selector is a class or instance selector.
 *  @return The implementation of the selector in the runtime.
 */
+ (nullable IMP)currentImplementationForClass:(Class)aClass
                                     selector:(SEL)selector
                              isClassSelector:(BOOL)isClassSelector;

/** Returns the original IMP for the given class and selector.
 *
 *  @param aClass The class to use.
 *  @param selector The selector to find the implementation of.
 *  @param isClassSelector A BOOL specifying whether the selector is a class or instance selector.
 *  @return The implementation of the selector in the runtime before any consumer or GULSwizzler
 *          swizzled.
 */
+ (nullable IMP)originalImplementationForClass:(Class)aClass
                                      selector:(SEL)selector
                               isClassSelector:(BOOL)isClassSelector;

/** Checks the runtime to see if a selector exists on a class. If a property is declared as
 *  @dynamic, we have a reverse swizzling situation, where the implementation of a method exists
 *  only in concrete subclasses, and NOT in the superclass. We can detect that situation using
 *  this helper method. Similarly, we can detect situations where a class doesn't implement a
 *  protocol method.
 *
 *  @param selector The selector to check for.
 *  @param aClass The class to check.
 *  @param isClassSelector A BOOL specifying whether the selector is a class or instance selector.
 *  @return YES if the method was found in this selector/class combination, NO otherwise.
 */
+ (BOOL)selector:(SEL)selector existsInClass:(Class)aClass isClassSelector:(BOOL)isClassSelector;

/** Returns a list of all Objective-C (and not primitive) ivars contained by the given object.
 *
 *  @param object The object whose ivars will be iterated.
 *  @return The list of ivar objects.
 */
+ (NSArray<id> *)ivarObjectsForObject:(id)object;

@end

NS_ASSUME_NONNULL_END
