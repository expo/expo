#import <objc/runtime.h>

@interface REAUtils : NSObject
+ (void)swizzleMethod:(SEL)originalSelector
             forClass:(Class)originalClass
                 with:(SEL)newSelector
            fromClass:(Class)newClass;
@end
