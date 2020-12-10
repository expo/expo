/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#if FB_SONARKIT_ENABLED

#import "SKSwizzle.h"

#import <Foundation/Foundation.h>
#import <objc/runtime.h>

void swizzleMethods(Class cls, SEL original, SEL swissled) {
  Method originalMethod = class_getInstanceMethod(cls, original);
  Method swissledMethod = class_getInstanceMethod(cls, swissled);

  BOOL didAddMethod = class_addMethod(
      cls,
      original,
      method_getImplementation(swissledMethod),
      method_getTypeEncoding(swissledMethod));

  if (didAddMethod) {
    class_replaceMethod(
        cls,
        swissled,
        method_getImplementation(originalMethod),
        method_getTypeEncoding(originalMethod));
  } else {
    method_exchangeImplementations(originalMethod, swissledMethod);
  }
}

#endif
