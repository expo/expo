#ifdef RN_FABRIC_ENABLED
#import <ABI48_0_0React/ABI48_0_0RCTViewComponentView.h>
#else
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#endif

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import "ABI48_0_0RNSScreen.h"
#import "ABI48_0_0RNSScreenStackHeaderSubview.h"
#import "ABI48_0_0RNSSearchBar.h"

@interface ABI48_0_0RNSScreenStackHeaderConfig :
#ifdef RN_FABRIC_ENABLED
    ABI48_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic, weak) ABI48_0_0RNSScreenView *screenView;

#ifdef RN_FABRIC_ENABLED
@property (nonatomic) BOOL show;
#else
@property (nonatomic) UIBlurEffectStyle blurEffect;
@property (nonatomic) BOOL hide;
#endif

@property (nonatomic, retain) NSString *title;
@property (nonatomic, retain) NSString *titleFontFamily;
@property (nonatomic, retain) NSNumber *titleFontSize;
@property (nonatomic, retain) NSString *titleFontWeight;
@property (nonatomic, retain) UIColor *titleColor;
@property (nonatomic, retain) NSString *backTitle;
@property (nonatomic, retain) NSString *backTitleFontFamily;
@property (nonatomic, retain) NSNumber *backTitleFontSize;
@property (nonatomic, retain) UIColor *backgroundColor;
@property (nonatomic, retain) UIColor *color;
@property (nonatomic) BOOL largeTitle;
@property (nonatomic, retain) NSString *largeTitleFontFamily;
@property (nonatomic, retain) NSNumber *largeTitleFontSize;
@property (nonatomic, retain) NSString *largeTitleFontWeight;
@property (nonatomic, retain) UIColor *largeTitleBackgroundColor;
@property (nonatomic) BOOL largeTitleHideShadow;
@property (nonatomic, retain) UIColor *largeTitleColor;
@property (nonatomic) BOOL hideBackButton;
@property (nonatomic) BOOL disableBackButtonMenu;
@property (nonatomic) BOOL hideShadow;
@property (nonatomic) BOOL translucent;
@property (nonatomic) BOOL backButtonInCustomView;
@property (nonatomic) UISemanticContentAttribute direction;

+ (void)willShowViewController:(UIViewController *)vc
                      animated:(BOOL)animated
                    withConfig:(ABI48_0_0RNSScreenStackHeaderConfig *)config;

@end

@interface ABI48_0_0RNSScreenStackHeaderConfigManager : ABI48_0_0RCTViewManager

@end

@interface ABI48_0_0RCTConvert (ABI48_0_0RNSScreenStackHeader)

+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;

@end
