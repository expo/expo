//
//  GTMMethodCheck.h
//
//  Copyright 2006-2016 Google Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not
//  use this file except in compliance with the License.  You may obtain a copy
//  of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
//  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
//  License for the specific language governing permissions and limitations under
//  the License.
//

#import <Foundation/Foundation.h>
#import <stdio.h>
#import <sysexits.h>

/// A macro for enforcing debug time checks to make sure all required methods are linked in
//
// When using categories, it can be very easy to forget to include the
// implementation of a category.
// Let's say you had a class foo that depended on method bar of class baz, and
// method bar was implemented as a member of a category.
// You could add the following code:
//
// GTM_METHOD_CHECK(baz, bar)
//
// and the code would check to make sure baz was implemented just before main
// was called. This works for both dynamic libraries, and executables.
//
//
// This is not compiled into release builds.

#ifdef DEBUG

// This is the "magic".
// A) we need a multi layer define here so that the preprocessor expands
//    __LINE__ the way we want it. We need __LINE__ so that each of our
//    GTM_METHOD_CHECKs generates a unique function name.
#define GTM_METHOD_CHECK(class, method) GTM_METHOD_CHECK_INNER(class, method, __LINE__)
#define GTM_METHOD_CHECK_INNER(class, method, line) \
    GTM_METHOD_CHECK_INNER_INNER(class, method, line)

// B) define a function that is called at startup to check that |class| has an
//    implementation for |method| (either a class method or an instance method).
#define GTM_METHOD_CHECK_INNER_INNER(class, method, line) \
__attribute__ ((constructor, visibility("hidden"))) \
    static void xxGTMMethodCheckMethod ## class ## line () { \
  @autoreleasepool { \
    if (![class instancesRespondToSelector:@selector(method)] \
        && ![class respondsToSelector:@selector(method)]) { \
      fprintf(stderr, "%s:%d: error: We need method '%s' to be linked in for class '%s'\n", \
              __FILE__, line, #method, #class); \
      exit(EX_SOFTWARE); \
    } \
  } \
}

#else  // DEBUG

// Do nothing in release.
#define GTM_METHOD_CHECK(class, method)

#endif  // DEBUG
