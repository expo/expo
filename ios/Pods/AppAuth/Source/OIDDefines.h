/*! @file OIDDefines.h
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

/*! @def OIDIsEqualIncludingNil(x, y)
    @brief Returns YES if x and y are equal by reference or value.
    @discussion NOTE: parameters may be evaluated multiple times. Be careful if using this check
        with expressions - especially if the expressions have side effects.
    @param x An object.
    @param y An object.
 */
#define OIDIsEqualIncludingNil(x, y) (((x) == (y)) || [(x) isEqual:(y)])

/*! @def OID_UNAVAILABLE_USE_INITIALIZER(designatedInitializer)
    @brief Provides a template implementation for init-family methods which have been marked as
        NS_UNAVILABLE. Stops the compiler from giving a warning when it's the super class'
        designated initializer, and gives callers useful feedback telling them what the
        new designated initializer is.
    @remarks Takes a SEL as a parameter instead of a string so that we get compiler warnings if the
        designated intializer's signature changes.
    @param designatedInitializer A SEL referencing the designated initializer.
 */
#define OID_UNAVAILABLE_USE_INITIALIZER(designatedInitializer) { \
  NSString *reason = [NSString stringWithFormat:@"Called: %@\nDesignated Initializer:%@", \
                                                NSStringFromSelector(_cmd), \
                                                NSStringFromSelector(designatedInitializer)]; \
  @throw [NSException exceptionWithName:@"Attempt to call unavailable initializer." \
                                 reason:reason \
                               userInfo:nil]; \
}
