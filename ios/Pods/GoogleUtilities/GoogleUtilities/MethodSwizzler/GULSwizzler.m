// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#import "Private/GULSwizzler.h"

#import <objc/runtime.h>

#import <GoogleUtilities/GULLogger.h>
#import "../Common/GULLoggerCodes.h"

#ifdef GUL_UNSWIZZLING_ENABLED
#import <GoogleUtilities/GULSwizzlingCache.h>
// We need a private method for an assert.
#import <GoogleUtilities/GULSwizzlingCache_Private.h>
#endif

static GULLoggerService kGULLoggerSwizzler = @"[GoogleUtilites/MethodSwizzler]";

dispatch_queue_t GetGULSwizzlingQueue() {
  static dispatch_queue_t queue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    queue = dispatch_queue_create("com.google.GULSwizzler", DISPATCH_QUEUE_SERIAL);
  });
  return queue;
}

@implementation GULSwizzler

+ (void)swizzleClass:(Class)aClass
            selector:(SEL)selector
     isClassSelector:(BOOL)isClassSelector
           withBlock:(nullable id)block {
  dispatch_sync(GetGULSwizzlingQueue(), ^{
    NSAssert(selector, @"The selector cannot be NULL");
    NSAssert(aClass, @"The class cannot be Nil");
    Class resolvedClass = aClass;
    Method method = nil;
    if (isClassSelector) {
      method = class_getClassMethod(aClass, selector);
      resolvedClass = object_getClass(aClass);
    } else {
      method = class_getInstanceMethod(aClass, selector);
    }
    NSAssert(method, @"You're attempting to swizzle a method that doesn't exist. (%@, %@)",
             NSStringFromClass(resolvedClass), NSStringFromSelector(selector));
    IMP newImp = imp_implementationWithBlock(block);

#ifdef GUL_UNSWIZZLING_ENABLED
    IMP currentImp = class_getMethodImplementation(resolvedClass, selector);
    [[GULSwizzlingCache sharedInstance] cacheCurrentIMP:currentImp
                                              forNewIMP:newImp
                                               forClass:resolvedClass
                                           withSelector:selector];
#endif

    const char *typeEncoding = method_getTypeEncoding(method);
    __unused IMP originalImpOfClass =
        class_replaceMethod(resolvedClass, selector, newImp, typeEncoding);

#ifdef GUL_UNSWIZZLING_ENABLED
    // If !originalImpOfClass, then the IMP came from a superclass.
    if (originalImpOfClass) {
      if (originalImpOfClass !=
          [[GULSwizzlingCache sharedInstance] originalIMPOfCurrentIMP:currentImp]) {
        GULLogWarning(kGULLoggerSwizzler, NO,
                      [NSString stringWithFormat:@"I-SWZ%06ld",
                                                 (long)kGULSwizzlerMessageCodeMethodSwizzling000],
                      @"Swizzling class: %@ SEL:%@ after it has been previously been swizzled.",
                      NSStringFromClass(resolvedClass), NSStringFromSelector(selector));
      }
    }
#endif
  });
}

+ (void)unswizzleClass:(Class)aClass selector:(SEL)selector isClassSelector:(BOOL)isClassSelector {
#ifdef GUL_UNSWIZZLING_ENABLED
  dispatch_sync(GetGULSwizzlingQueue(), ^{
    NSAssert(aClass != nil && selector != nil, @"You cannot unswizzle a nil class or selector.");
    Method method = nil;
    Class resolvedClass = aClass;
    if (isClassSelector) {
      resolvedClass = object_getClass(aClass);
      method = class_getClassMethod(aClass, selector);
    } else {
      method = class_getInstanceMethod(aClass, selector);
    }
    NSAssert(method, @"Couldn't find the method you're unswizzling in the runtime.");
    IMP originalImp = [[GULSwizzlingCache sharedInstance] cachedIMPForClass:resolvedClass
                                                               withSelector:selector];
    NSAssert(originalImp, @"This class/selector combination hasn't been swizzled");
    IMP currentImp = method_setImplementation(method, originalImp);
    BOOL didRemoveBlock = imp_removeBlock(currentImp);
    NSAssert(didRemoveBlock, @"Wasn't able to remove the block of a swizzled IMP.");
    [[GULSwizzlingCache sharedInstance] clearCacheForSwizzledIMP:currentImp
                                                        selector:selector
                                                          aClass:resolvedClass];
  });
#else
  NSAssert(NO, @"Unswizzling is disabled.");
#endif
}

+ (nullable IMP)originalImplementationForClass:(Class)aClass
                                      selector:(SEL)selector
                               isClassSelector:(BOOL)isClassSelector {
#ifdef GUL_UNSWIZZLING_ENABLED
  __block IMP originalImp = nil;
  dispatch_sync(GetGULSwizzlingQueue(), ^{
    Class resolvedClass = isClassSelector ? object_getClass(aClass) : aClass;
    originalImp = [[GULSwizzlingCache sharedInstance] cachedIMPForClass:resolvedClass
                                                           withSelector:selector];
    NSAssert(originalImp, @"The IMP for this class/selector combo doesn't exist (%@, %@).",
             NSStringFromClass(resolvedClass), NSStringFromSelector(selector));
  });
  return originalImp;
#else
  NSAssert(NO, @"Unswizzling is disabled and the original IMP is not cached.");
  return nil;
#endif
}

+ (nullable IMP)currentImplementationForClass:(Class)aClass
                                     selector:(SEL)selector
                              isClassSelector:(BOOL)isClassSelector {
  NSAssert(selector, @"The selector cannot be NULL");
  NSAssert(aClass, @"The class cannot be Nil");
  if (selector == NULL || aClass == nil) {
    return nil;
  }
  __block IMP currentIMP = nil;
  dispatch_sync(GetGULSwizzlingQueue(), ^{
    Method method = nil;
    if (isClassSelector) {
      method = class_getClassMethod(aClass, selector);
    } else {
      method = class_getInstanceMethod(aClass, selector);
    }
    NSAssert(method, @"The Method for this class/selector combo doesn't exist (%@, %@).",
             NSStringFromClass(aClass), NSStringFromSelector(selector));
    if (method == nil) {
      return;
    }
    currentIMP = method_getImplementation(method);
    NSAssert(currentIMP, @"The IMP for this class/selector combo doesn't exist (%@, %@).",
             NSStringFromClass(aClass), NSStringFromSelector(selector));
  });
  return currentIMP;
}

+ (BOOL)selector:(SEL)selector existsInClass:(Class)aClass isClassSelector:(BOOL)isClassSelector {
  Method method = isClassSelector ? class_getClassMethod(aClass, selector)
                                  : class_getInstanceMethod(aClass, selector);
  return method != nil;
}

+ (NSArray<id> *)ivarObjectsForObject:(id)object {
  NSMutableArray *array = [NSMutableArray array];
  unsigned int count;
  Ivar *vars = class_copyIvarList([object class], &count);
  for (NSUInteger i = 0; i < count; i++) {
    const char *typeEncoding = ivar_getTypeEncoding(vars[i]);
    // Check to see if the ivar is an object.
    if (strncmp(typeEncoding, "@", 1) == 0) {
      id ivarObject = object_getIvar(object, vars[i]);
      [array addObject:ivarObject];
    }
  }
  free(vars);
  return array;
}

@end
