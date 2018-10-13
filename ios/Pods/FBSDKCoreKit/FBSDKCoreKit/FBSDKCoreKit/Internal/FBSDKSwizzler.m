// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKSwizzler.h"

#import <objc/runtime.h>

#define MIN_ARGS 2
#define MAX_ARGS 5

@interface FBSDKSwizzle : NSObject

@property (nonatomic, assign) Class class;
@property (nonatomic, assign) SEL selector;
@property (nonatomic, assign) IMP originalMethod;
@property (nonatomic, assign) uint numArgs;
@property (nonatomic, copy) NSMapTable *blocks;

- (instancetype)initWithBlock:(swizzleBlock)aBlock
              named:(NSString *)aName
           forClass:(Class)aClass
           selector:(SEL)aSelector
     originalMethod:(IMP)aMethod
        withNumArgs:(uint)numArgs;

@end

static NSMapTable *swizzles;

static FBSDKSwizzle* fb_findSwizzle(id self, SEL _cmd){
  Method aMethod = class_getInstanceMethod([self class], _cmd);
  FBSDKSwizzle *swizzle = (FBSDKSwizzle *)[swizzles objectForKey:MAPTABLE_ID(aMethod)];
  Class this_class = [self class];
  while (!swizzle && class_getSuperclass(this_class)){
    this_class = class_getSuperclass(this_class);
    aMethod = class_getInstanceMethod(this_class, _cmd);
    swizzle = (FBSDKSwizzle *)[swizzles objectForKey:MAPTABLE_ID(aMethod)];
  }
  return swizzle;
}

static void fb_swizzledMethod_2(id self, SEL _cmd)
{
    FBSDKSwizzle *swizzle = fb_findSwizzle(self, _cmd);
    if (swizzle) {
        ((void(*)(id, SEL))swizzle.originalMethod)(self, _cmd);

        NSEnumerator *blocks = [swizzle.blocks objectEnumerator];
        swizzleBlock block;
        while ((block = [blocks nextObject])) {
            block(self, _cmd);
        }
    }
}

static void fb_swizzledMethod_3(id self, SEL _cmd, id arg)
{
    FBSDKSwizzle *swizzle = fb_findSwizzle(self, _cmd);
    if (swizzle) {
        ((void(*)(id, SEL, id))swizzle.originalMethod)(self, _cmd, arg);

        NSEnumerator *blocks = [swizzle.blocks objectEnumerator];
        swizzleBlock block;
        while ((block = [blocks nextObject])) {
          block(self, _cmd, arg);
        }
    }
}

static void fb_swizzledMethod_4(id self, SEL _cmd, id arg, id arg2)
{
    FBSDKSwizzle *swizzle = fb_findSwizzle(self, _cmd);
    if (swizzle) {
        ((void(*)(id, SEL, id, id))swizzle.originalMethod)(self, _cmd, arg, arg2);

        NSEnumerator *blocks = [swizzle.blocks objectEnumerator];
        swizzleBlock block;
        while ((block = [blocks nextObject])) {
            block(self, _cmd, arg, arg2);
        }
    }
}

static void fb_swizzledMethod_5(id self, SEL _cmd, id arg, id arg2, id arg3)
{
    FBSDKSwizzle *swizzle = fb_findSwizzle(self, _cmd);
    if (swizzle) {
        ((void(*)(id, SEL, id, id, id))swizzle.originalMethod)(self, _cmd, arg, arg2, arg3);

        NSEnumerator *blocks = [swizzle.blocks objectEnumerator];
        swizzleBlock block;
        while ((block = [blocks nextObject])) {
            block(self, _cmd, arg, arg2, arg3);
        }
    }
}

static void fb_swizzleMethod_4_io(id self, SEL _cmd, NSInteger arg, id arg2)
{
  FBSDKSwizzle *swizzle = fb_findSwizzle(self, _cmd);
  if (swizzle) {
    ((void(*)(id, SEL, NSInteger, id))swizzle.originalMethod)(self, _cmd, arg, arg2);

    NSEnumerator *blocks = [swizzle.blocks objectEnumerator];
    swizzleBlock block;
    while ((block = [blocks nextObject])) {
      block(self, _cmd, arg, arg2);
    }
  }
}

static void (*fb_swizzledMethods[MAX_ARGS - MIN_ARGS + 1])() = {fb_swizzledMethod_2, fb_swizzledMethod_3, fb_swizzledMethod_4, fb_swizzledMethod_5};

@implementation FBSDKSwizzler

+ (void)setup {
  if (!swizzles) {
    swizzles = [NSMapTable mapTableWithKeyOptions:(NSPointerFunctionsOpaqueMemory | NSPointerFunctionsOpaquePersonality)
                                     valueOptions:(NSPointerFunctionsStrongMemory | NSPointerFunctionsObjectPointerPersonality)];
  }
}

+ (void)printSwizzles
{
    NSEnumerator *en = [swizzles objectEnumerator];
    FBSDKSwizzle *swizzle;
    while ((swizzle = (FBSDKSwizzle *)[en nextObject])) {
        NSLog(@"%@", swizzle);
    }
}

+ (FBSDKSwizzle *)swizzleForMethod:(Method)aMethod
{
    return (FBSDKSwizzle *)[swizzles objectForKey:MAPTABLE_ID(aMethod)];
}

+ (void)removeSwizzleForMethod:(Method)aMethod
{
    [swizzles removeObjectForKey:MAPTABLE_ID(aMethod)];
}

+ (void)setSwizzle:(FBSDKSwizzle *)swizzle forMethod:(Method)aMethod
{
    [swizzles setObject:swizzle forKey:MAPTABLE_ID(aMethod)];
}

+ (BOOL)isLocallyDefinedMethod:(Method)aMethod onClass:(Class)aClass
{
    uint count;
    BOOL isLocal = NO;
    Method *methods = class_copyMethodList(aClass, &count);
    for (NSUInteger i = 0; i < count; i++) {
        if (aMethod == methods[i]) {
            isLocal = YES;
            break;
        }
    }
    free(methods);
    return isLocal;
}

+ (void)swizzleSelector:(SEL)aSelector onClass:(Class)aClass withBlock:(swizzleBlock)aBlock named:(NSString *)aName
{
    [FBSDKSwizzler setup];
    Method aMethod = class_getInstanceMethod(aClass, aSelector);
    if (aMethod) {
        uint numArgs = method_getNumberOfArguments(aMethod);
        if (numArgs >= MIN_ARGS && numArgs <= MAX_ARGS) {

            BOOL isLocal = [self isLocallyDefinedMethod:aMethod onClass:aClass];
            IMP swizzledMethod = (IMP)fb_swizzledMethods[numArgs - 2];
            // Check whether the first parameter is integer
            if (4 == numArgs) {
              NSString *firstType = [NSString stringWithUTF8String:method_copyArgumentType(aMethod, 2)];
              NSString *integerTypes = @"islq";
              if ([integerTypes containsString:[firstType lowercaseString]]) {
                swizzledMethod = (IMP)fb_swizzleMethod_4_io;
              }
            }

            FBSDKSwizzle *swizzle = [self swizzleForMethod:aMethod];

            if (isLocal) {
                if (!swizzle) {
                    IMP originalMethod = method_getImplementation(aMethod);

                    // Replace the local implementation of this method with the swizzled one
                    method_setImplementation(aMethod,swizzledMethod);

                    // Create and add the swizzle
                    swizzle = [[FBSDKSwizzle alloc] initWithBlock:aBlock named:aName forClass:aClass selector:aSelector originalMethod:originalMethod withNumArgs:numArgs];
                    [self setSwizzle:swizzle forMethod:aMethod];

                } else {
                    [swizzle.blocks setObject:aBlock forKey:aName];
                }
            } else {
                IMP originalMethod = swizzle ? swizzle.originalMethod : method_getImplementation(aMethod);

                // Add the swizzle as a new local method on the class.
                if (!class_addMethod(aClass, aSelector, swizzledMethod, method_getTypeEncoding(aMethod))) {
                    return;
                }
                // Now re-get the Method, it should be the one we just added.
                Method newMethod = class_getInstanceMethod(aClass, aSelector);
                if (aMethod == newMethod) {
                    return;
                }

                FBSDKSwizzle *newSwizzle = [[FBSDKSwizzle alloc] initWithBlock:aBlock named:aName forClass:aClass selector:aSelector originalMethod:originalMethod withNumArgs:numArgs];
                [self setSwizzle:newSwizzle forMethod:newMethod];
            }
        }
    }
}

+ (void)unswizzleSelector:(SEL)aSelector onClass:(Class)aClass
{
    Method aMethod = class_getInstanceMethod(aClass, aSelector);
    FBSDKSwizzle *swizzle = [self swizzleForMethod:aMethod];
    if (swizzle) {
        method_setImplementation(aMethod, swizzle.originalMethod);
        [self removeSwizzleForMethod:aMethod];
    }
}

/*
 Remove the named swizzle from the given class/selector. If aName is nil, remove all
 swizzles for this class/selector
*/
+ (void)unswizzleSelector:(SEL)aSelector onClass:(Class)aClass named:(NSString *)aName
{
    Method aMethod = class_getInstanceMethod(aClass, aSelector);
    FBSDKSwizzle *swizzle = [self swizzleForMethod:aMethod];
    if (swizzle) {
        if (aName) {
            [swizzle.blocks removeObjectForKey:aName];
        }
        if (!aName || swizzle.blocks.count == 0) {
            method_setImplementation(aMethod, swizzle.originalMethod);
            [self removeSwizzleForMethod:aMethod];
        }
    }
}

@end


@implementation FBSDKSwizzle

- (instancetype)init
{
    if ((self = [super init])) {
        self.blocks = [NSMapTable mapTableWithKeyOptions:(NSPointerFunctionsStrongMemory
                                                          | NSPointerFunctionsObjectPersonality)
                                            valueOptions:(NSPointerFunctionsStrongMemory
                                                          | NSPointerFunctionsObjectPointerPersonality)];
    }
    return self;
}

- (instancetype)initWithBlock:(swizzleBlock)aBlock
              named:(NSString *)aName
           forClass:(Class)aClass
           selector:(SEL)aSelector
     originalMethod:(IMP)aMethod
        withNumArgs:(uint)numArgs
{
    if ((self = [self init])) {
        self.class = aClass;
        self.selector = aSelector;
        self.numArgs = numArgs;
        self.originalMethod = aMethod;
        [self.blocks setObject:aBlock forKey:aName];
    }
    return self;
}

- (NSString *)description
{
    NSString *descriptors = @"";
    NSString *key;
    NSEnumerator *keys = [self.blocks keyEnumerator];
    while ((key = [keys nextObject])) {
        descriptors = [descriptors stringByAppendingFormat:@"\t%@ : %@\n", key, [self.blocks objectForKey:key]];
    }
    return [NSString stringWithFormat:@"Swizzle on %@::%@ [\n%@]", NSStringFromClass(self.class), NSStringFromSelector(self.selector), descriptors];
}

@end
