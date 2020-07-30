#import "UIViewController+SEGScreen.h"
#import <objc/runtime.h>
#import "SEGAnalytics.h"
#import "SEGAnalyticsUtils.h"
#import "SEGScreenReporting.h"


@implementation UIViewController (SEGScreen)

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


+ (UIViewController *)seg_topViewController
{
    UIViewController *root = [[SEGAnalytics sharedAnalytics] configuration].application.delegate.window.rootViewController;
    return [self seg_topViewController:root];
}

+ (UIViewController *)seg_topViewController:(UIViewController *)rootViewController
{
    UIViewController *nextRootViewController = [self seg_nextRootViewController:rootViewController];
    if (nextRootViewController) {
        return [self seg_topViewController:nextRootViewController];
    }

    return rootViewController;
}

+ (UIViewController *)seg_nextRootViewController:(UIViewController *)rootViewController
{
    UIViewController *presentedViewController = rootViewController.presentedViewController;
    if (presentedViewController != nil) {
        return presentedViewController;
    }

    if ([rootViewController isKindOfClass:[UINavigationController class]]) {
        UIViewController *lastViewController = ((UINavigationController *)rootViewController).viewControllers.lastObject;
        return lastViewController;
    }

    if ([rootViewController isKindOfClass:[UITabBarController class]]) {
        __auto_type *currentTabViewController = ((UITabBarController*)rootViewController).selectedViewController;
        if (currentTabViewController != nil) {
            return currentTabViewController;
        }
    }

    if (rootViewController.childViewControllers.count > 0) {
        if ([rootViewController conformsToProtocol:@protocol(SEGScreenReporting)] && [rootViewController respondsToSelector:@selector(seg_mainViewController)]) {
            __auto_type screenReporting = (UIViewController<SEGScreenReporting>*)rootViewController;
            return screenReporting.seg_mainViewController;
        }

        // fall back on first child UIViewController as a "best guess" assumption
        __auto_type *firstChildViewController = rootViewController.childViewControllers.firstObject;
        if (firstChildViewController != nil) {
            return firstChildViewController;
        }
    }

    return nil;
}

- (void)seg_viewDidAppear:(BOOL)animated
{
    UIViewController *top = [[self class] seg_topViewController];
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
        __auto_type screenReporting = (UIViewController<SEGScreenReporting>*)top;
        [screenReporting seg_trackScreen:top name:name];
        return;
    }

    [[SEGAnalytics sharedAnalytics] screen:name properties:nil options:nil];

    [self seg_viewDidAppear:animated];
}

@end
