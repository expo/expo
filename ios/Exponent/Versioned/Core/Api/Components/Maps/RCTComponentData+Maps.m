//
//  RCTComponentData+Maps.m
//  AirMaps
//
//  Created by Salah Ghanim on 24.12.23.
//  Copyright © 2023 Christopher. All rights reserved.
//

#import "RCTComponentData+Maps.h"
#import <objc/runtime.h>
#import <Foundation/NSObjCRuntime.h>

@implementation RCTComponentData (Maps)


- (void) myCustom_setProps:(NSDictionary<NSString *, id> *)props forShadowView:(RCTShadowView *)shadowView{
    // Pass initialProps to any manager that supports initialProps
    id manager = [self manager];
     if ([manager respondsToSelector:@selector(setInitialProps:)]) {
         [manager performSelector:@selector(setInitialProps:) withObject:props];
     }

    // Call the original method
    [self myCustom_setProps:props forShadowView:shadowView];
}

+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [RCTComponentData class]; // Or the class where the method is defined

        SEL originalSelector = @selector(setProps:forShadowView:);
        SEL swizzledSelector = @selector(myCustom_setProps:forShadowView:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod = class_addMethod(class,
                                            originalSelector,
                                            method_getImplementation(swizzledMethod),
                                            method_getTypeEncoding(swizzledMethod));

        if (didAddMethod) {
            class_replaceMethod(class,
                                swizzledSelector,
                                method_getImplementation(originalMethod),
                                method_getTypeEncoding(originalMethod));
        } else {
            method_exchangeImplementations(originalMethod, swizzledMethod);
        }
    });
}


@end
