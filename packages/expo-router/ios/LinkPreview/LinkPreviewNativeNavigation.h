// Copyright 2015-present 650 Industries. All rights reserved.

#import <RNScreens/RNSDismissibleModalProtocol.h>
#import <RNScreens/RNSTabBarController.h>

@interface LinkPreviewNativeNavigationObjC : NSObject

/*
 * Pushes the previously preloaded view.
 * This function will set the activity state of the preloaded screen view to 2
 */
+ (void)pushPreloadedView:(nonnull UIView *)view
            ontoStackView:(nonnull UIView *)rawStackView;

/*
 * Helper function to check if the view is a RNSScreenStackView. Can be used in
 * Swift
 */
+ (BOOL)isRNSScreenStackView:(UIView *)view;
/*
 * Helper function to get all screen IDs from a RNSScreenStackView.
 */
+ (nonnull NSArray<NSString *> *)getStackViewScreenIds:(UIView *)view;
/*
 * Helper function to get all screen views from a RNSScreenStackView.
 */
+ (nonnull NSArray<UIView *> *)getScreenViews:(UIView *)view;
/*
 * Helper function to get the screen ID of a RNSScreenView.
 */
+ (nonnull NSString *)getScreenId:(UIView *)view;

+ (nonnull NSString *)getTabKey:(UIView *)view;

+ (BOOL)isRNSBottomTabsScreenComponentView:(UIView *)view;

+ (BOOL)isRNSTabBarController:(UIView *)view;

+ (nullable RNSTabBarController *)getBottomTabControllerFromView:(UIView *)view;

+ (BOOL)isRNSBottomTabsHostComponentView:(UIView *)view;

+ (nullable UIView *)getTab:(UITabBarController *)controller
                    withKey:(NSString *)key;

@end

@protocol LinkPreviewModalDismissible <RNSDismissibleModalProtocol>
@required
@end
