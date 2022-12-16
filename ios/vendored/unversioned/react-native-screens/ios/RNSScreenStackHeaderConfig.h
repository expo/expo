#ifdef RN_FABRIC_ENABLED
#import <React/RCTViewComponentView.h>
#else
#import <React/RCTViewManager.h>
#endif

#import <React/RCTConvert.h>
#import "RNSScreen.h"
#import "RNSScreenStackHeaderSubview.h"
#import "RNSSearchBar.h"

@interface RNSScreenStackHeaderConfig :
#ifdef RN_FABRIC_ENABLED
    RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic, weak) RNSScreenView *screenView;

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
                    withConfig:(RNSScreenStackHeaderConfig *)config;

@end

@interface RNSScreenStackHeaderConfigManager : RCTViewManager

@end

@interface RCTConvert (RNSScreenStackHeader)

+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;

@end
