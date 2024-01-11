#import <RNReanimated/REAUtils.h>

@implementation REAUtils

+ (void)swizzleMethod:(SEL)originalSelector
             forClass:(Class)originalClass
                 with:(SEL)newSelector
            fromClass:(Class)newClass
{
  Method originalMethod = class_getInstanceMethod(originalClass, originalSelector);
  Method newMethod = class_getInstanceMethod(newClass, newSelector);
  IMP originalImplementation = method_getImplementation(originalMethod);
  IMP newImplementation = method_getImplementation(newMethod);
  class_replaceMethod(originalClass, newSelector, originalImplementation, method_getTypeEncoding(originalMethod));
  class_replaceMethod(originalClass, originalSelector, newImplementation, method_getTypeEncoding(newMethod));
}

@end
