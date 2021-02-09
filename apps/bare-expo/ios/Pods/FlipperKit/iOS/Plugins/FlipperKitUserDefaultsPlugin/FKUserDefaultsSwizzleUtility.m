/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "FKUserDefaultsSwizzleUtility.h"
#import <objc/runtime.h>

@interface FKUserDefaultsSwizzleUtility ()
@property(nonatomic, strong) NSMutableSet* swizzledClasses;
@property(nonatomic, strong) NSMutableDictionary* swizzledBlocks;
@property(nonatomic) IMP forwardingIMP;
@end

@implementation FKUserDefaultsSwizzleUtility

- (instancetype)init {
  if (self = [super init]) {
    _swizzledClasses = [NSMutableSet set];
    _swizzledBlocks = [NSMutableDictionary dictionary];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wundeclared-selector"
    _forwardingIMP = class_getMethodImplementation(
        [NSObject class], @selector(flipperKitThisMethodShouldNotExist));
#pragma clang diagnostic pop
  }
  return self;
}

+ (instancetype)sharedInstance {
  static FKUserDefaultsSwizzleUtility* sharedInstance = nil;
  static dispatch_once_t onceToken = 0;
  dispatch_once(&onceToken, ^{
    sharedInstance = [[self alloc] init];
  });
  return sharedInstance;
}

+ (void)swizzleSelector:(SEL)selector
                  class:(Class)aClass
                  block:(void (^)(NSInvocation* _Nonnull))block {
  [[self sharedInstance] swizzleSelector:selector class:aClass block:block];
}

- (void)swizzleSelector:(SEL)selector
                  class:(Class)aClass
                  block:(void (^)(NSInvocation* _Nonnull))blk {
  if (![self.swizzledClasses containsObject:aClass]) {
    SEL fwdSel = @selector(forwardInvocation:);
    Method m = class_getInstanceMethod(aClass, fwdSel);
    __block IMP orig;
    __weak typeof(self) weakSelf = self;
    IMP imp = imp_implementationWithBlock(^(id this, NSInvocation* invocation) {
      NSString* selStr = NSStringFromSelector([invocation selector]);
      void (^block)(NSInvocation*) = weakSelf.swizzledBlocks[aClass][selStr];
      if (blk != nil) {
        NSString* originalStr =
            [@"comfacebookFlipperKit_" stringByAppendingString:selStr];
        [invocation setSelector:NSSelectorFromString(originalStr)];
        if (block != nil) {
          block(invocation);
        }
      } else {
        ((void (*)(id, SEL, NSInvocation*))orig)(this, fwdSel, invocation);
      }
    });
    orig = method_setImplementation(m, imp);
    [self.swizzledClasses addObject:aClass];
  }
  NSMutableDictionary* classDict = self.swizzledBlocks[aClass];
  if (classDict == nil) {
    classDict = [NSMutableDictionary dictionary];
    self.swizzledBlocks[(id)aClass] = classDict;
  }
  classDict[NSStringFromSelector(selector)] = blk;
  Method m = class_getInstanceMethod(aClass, selector);
  NSString* newSelStr = [@"comfacebookFlipperKit_"
      stringByAppendingString:NSStringFromSelector(selector)];
  SEL newSel = NSSelectorFromString(newSelStr);
  class_addMethod(
      aClass, newSel, method_getImplementation(m), method_getTypeEncoding(m));
  method_setImplementation(m, self.forwardingIMP);
}
@end
