#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTViewManager.h>
#endif

#import <ABI49_0_0React/ABI49_0_0RCTConvert.h>
#import "ABI49_0_0RNSScreen.h"
#import "ABI49_0_0RNSScreenStackHeaderSubview.h"
#import "ABI49_0_0RNSSearchBar.h"

@interface NSString (ABI49_0_0RNSStringUtil)

+ (BOOL)ABI49_0_0RNSisBlank:(NSString *)string;

@end

@interface ABI49_0_0RNSScreenStackHeaderConfig :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView
#else
    UIView
#endif

@property (nonatomic, weak) ABI49_0_0RNSScreenView *screenView;

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
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
@property (nonatomic, getter=isBackTitleVisible) BOOL backTitleVisible;
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
                    withConfig:(ABI49_0_0RNSScreenStackHeaderConfig *)config;

@end

@interface ABI49_0_0RNSScreenStackHeaderConfigManager : ABI49_0_0RCTViewManager

@end

@interface ABI49_0_0RCTConvert (ABI49_0_0RNSScreenStackHeader)

+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;

@end
