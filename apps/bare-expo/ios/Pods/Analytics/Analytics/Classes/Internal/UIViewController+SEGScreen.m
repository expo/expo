#import "UIViewController+SEGScreen.h"
#import <objc/runtime.h>
#import "SEGAnalytics.h"
#import "SEGAnalyticsUtils.h"


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
    UIViewController *presentedViewController = rootViewController.presentedViewController;
    if (presentedViewController != nil) {
        return [self seg_topViewController:presentedViewController];
    }

    if ([rootViewController isKindOfClass:[UINavigationController class]]) {
        UIViewController *lastViewController = [[(UINavigationController *)rootViewController viewControllers] lastObject];
        return [self seg_topViewController:lastViewController];
    }

    return rootViewController;
}

- (void)seg_viewDidAppear:(BOOL)animated
{
    UIViewController *top = [[self class] seg_topViewController];
    if (!top) {
        SEGLog(@"Could not infer screen.");
        return;
    }

    NSString *name = [top title];
    if (!name || name.length == 0) {
        name = [[[top class] description] stringByReplacingOccurrencesOfString:@"ViewController" withString:@""];
        // Class name could be just "ViewController".
        if (name.length == 0) {
            SEGLog(@"Could not infer screen name.");
            name = @"Unknown";
        }
    }
    [[SEGAnalytics sharedAnalytics] screen:name properties:nil options:nil];

    [self seg_viewDidAppear:animated];
}

@end
