//
//  NSViewController+SEGScreen.m
//  Analytics
//
//  Created by Cody Garvin on 7/8/20.
//  Copyright © 2020 Segment. All rights reserved.
//

#import "NSViewController+SEGScreen.h"
#import <objc/runtime.h>
#import "SEGAnalytics.h"
#import "SEGAnalyticsUtils.h"
#import "SEGScreenReporting.h"


#if TARGET_OS_OSX
@implementation NSViewController (SEGScreen)

+ (void)seg_swizzleViewDidAppear
{
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Class class = [self class];

        SEL originalSelector = @selector(viewDidAppear:);
        SEL swizzledSelector = @selector(seg_viewDidAppear:);

        Method originalMethod = class_getInstanceMethod(class, originalSelector);
        Method swizzledMethod = class_getInstanceMethod(class, swizzledSelector);

        BOOL didAddMethod =
            class_addMethod(class,
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

+ (NSViewController *)seg_rootViewControllerFromView:(NSView *)view
{
    NSViewController *rootViewController = view.window.contentViewController;
    
    if (rootViewController.childViewControllers.count > 0) {
        if ([rootViewController conformsToProtocol:@protocol(SEGScreenReporting)] && [rootViewController respondsToSelector:@selector(seg_mainViewController)]) {
            __auto_type screenReporting = (NSViewController<SEGScreenReporting>*)rootViewController;
            return screenReporting.seg_mainViewController;
        }

        // fall back on first child UIViewController as a "best guess" assumption
        __auto_type *firstChildViewController = rootViewController.childViewControllers.firstObject;
        if (firstChildViewController != nil) {
            return firstChildViewController;
        }
    }

    return rootViewController;
}

- (void)seg_viewDidAppear:(BOOL)animated
{
    NSViewController *top = [[self class] seg_rootViewControllerFromView:self.view];
    if (!top) {
        SEGLog(@"Could not infer screen.");
        return;
    }

    NSString *name = [[[top class] description] stringByReplacingOccurrencesOfString:@"ViewController" withString:@""];
    
    if (!name || name.length == 0) {
        // if no class description found, try view controller's title.
        name = [top title];
        // Class name could be just "ViewController".
        if (name.length == 0) {
            SEGLog(@"Could not infer screen name.");
            name = @"Unknown";
        }
    }

    if ([top conformsToProtocol:@protocol(SEGScreenReporting)] && [top respondsToSelector:@selector(seg_trackScreen:name:)]) {
        __auto_type screenReporting = (NSViewController<SEGScreenReporting>*)top;
        [screenReporting seg_trackScreen:top name:name];
        return;
    }

    [[SEGAnalytics sharedAnalytics] screen:name properties:nil options:nil];

    [self seg_viewDidAppear:animated];
}
@end
#endif
