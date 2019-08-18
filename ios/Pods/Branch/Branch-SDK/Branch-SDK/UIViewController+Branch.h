//
//  UIViewController+Branch.h
//  Branch-SDK
//
//  Created by Edward Smith on 11/16/17.
//  Copyright © 2017 Branch. All rights reserved.
//

#if __has_feature(modules)
@import UIKit;
#else
#import <UIKit/UIKit.h>
#endif

@interface UIViewController (Branch)
+ (UIWindow*_Nullable) bnc_currentWindow;
+ (UIViewController*_Nullable) bnc_currentViewController;
- (UIViewController*_Nonnull)  bnc_currentViewController;
@end

void BNCForceUIViewControllerCategoryToLoad(void) __attribute__((constructor));
