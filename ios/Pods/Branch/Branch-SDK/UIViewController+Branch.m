//
//  UIViewController+Branch.m
//  Branch-SDK
//
//  Created by Edward Smith on 11/16/17.
//  Copyright © 2017 Branch. All rights reserved.
//

#import "UIViewController+Branch.h"

@implementation UIViewController (Branch)

+ (UIWindow*_Nullable) bnc_currentWindow {
    Class UIApplicationClass = NSClassFromString(@"UIApplication");
    if (UIApplicationClass) {
        UIWindow *keyWindow = nil;

        if ([[UIApplicationClass sharedApplication].delegate respondsToSelector:@selector(window)]) {
            keyWindow = [UIApplicationClass sharedApplication].delegate.window;
        }
        if (keyWindow && !keyWindow.isHidden && keyWindow.rootViewController) return keyWindow;

        keyWindow = [UIApplicationClass sharedApplication].keyWindow;
        if (keyWindow && !keyWindow.isHidden && keyWindow.rootViewController) return keyWindow;

        for (keyWindow in [UIApplicationClass sharedApplication].windows.reverseObjectEnumerator) {
            if (!keyWindow.isHidden && keyWindow.rootViewController) return keyWindow;
        }
    }

    // ToDo: Put different code for extensions here.

    return nil;
}

+ (UIViewController*_Nullable) bnc_currentViewController {
    UIWindow *window = [UIViewController bnc_currentWindow];
    return [window.rootViewController bnc_currentViewController];
}

- (UIViewController*_Nonnull) bnc_currentViewController {
    if ([self isKindOfClass:[UINavigationController class]]) {
        return [((UINavigationController *)self).visibleViewController bnc_currentViewController];
    }

    if ([self isKindOfClass:[UITabBarController class]]) {
        return [((UITabBarController *)self).selectedViewController bnc_currentViewController];
    }

    if ([self isKindOfClass:[UISplitViewController class]]) {
        return [((UISplitViewController *)self).viewControllers.lastObject bnc_currentViewController];
    }

    if ([self isKindOfClass:[UIPageViewController class]]) {
        return [((UIPageViewController*)self).viewControllers.lastObject bnc_currentViewController];
    }

    if (self.presentedViewController != nil && !self.presentedViewController.isBeingDismissed) {
        return [self.presentedViewController bnc_currentViewController];
    }

    return self;
}

@end

__attribute__((constructor)) void BNCForceUIViewControllerCategoryToLoad() {
    //  Nothing here, but forces linker to load the category.
}
