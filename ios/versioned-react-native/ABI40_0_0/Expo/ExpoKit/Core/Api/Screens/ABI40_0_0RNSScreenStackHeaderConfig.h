#import <ABI40_0_0React/ABI40_0_0RCTViewManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTConvert.h>

#import "ABI40_0_0RNSScreen.h"

typedef NS_ENUM(NSInteger, ABI40_0_0RNSStatusBarStyle) {
  ABI40_0_0RNSStatusBarStyleAuto,
  ABI40_0_0RNSStatusBarStyleInverted,
  ABI40_0_0RNSStatusBarStyleLight,
  ABI40_0_0RNSStatusBarStyleDark,
};

@interface ABI40_0_0RNSScreenStackHeaderConfig : UIView

@property (nonatomic, weak) ABI40_0_0RNSScreenView *screenView;

@property (nonatomic, retain) NSString *title;
@property (nonatomic, retain) NSString *titleFontFamily;
@property (nonatomic, retain) NSNumber *titleFontSize;
@property (nonatomic, retain) UIColor *titleColor;
@property (nonatomic, retain) NSString *backTitle;
@property (nonatomic, retain) NSString *backTitleFontFamily;
@property (nonatomic, retain) NSNumber *backTitleFontSize;
@property (nonatomic, retain) UIColor *backgroundColor;
@property (nonatomic) UIBlurEffectStyle blurEffect;
@property (nonatomic, retain) UIColor *color;
@property (nonatomic) BOOL hide;
@property (nonatomic) BOOL largeTitle;
@property (nonatomic, retain) NSString *largeTitleFontFamily;
@property (nonatomic, retain) NSNumber *largeTitleFontSize;
@property (nonatomic, retain) UIColor *largeTitleBackgroundColor;
@property (nonatomic) BOOL largeTitleHideShadow;
@property (nonatomic, retain) UIColor *largeTitleColor;
@property (nonatomic) BOOL hideBackButton;
@property (nonatomic) BOOL backButtonInCustomView;
@property (nonatomic) BOOL hideShadow;
@property (nonatomic) BOOL translucent;
@property (nonatomic) UISemanticContentAttribute direction;
@property (nonatomic) ABI40_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;

+ (void)willShowViewController:(UIViewController *)vc animated:(BOOL)animated withConfig:(ABI40_0_0RNSScreenStackHeaderConfig*)config;
+ (void)updateStatusBarAppearance;
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(ABI40_0_0RNSStatusBarStyle)statusBarStyle;

@end

@interface ABI40_0_0RNSScreenStackHeaderConfigManager : ABI40_0_0RCTViewManager

@end

typedef NS_ENUM(NSInteger, ABI40_0_0RNSScreenStackHeaderSubviewType) {
  ABI40_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI40_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI40_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI40_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI40_0_0RNSScreenStackHeaderSubviewTypeCenter,
};

@interface ABI40_0_0RCTConvert (ABI40_0_0RNSScreenStackHeader)

+ (ABI40_0_0RNSScreenStackHeaderSubviewType)ABI40_0_0RNSScreenStackHeaderSubviewType:(id)json;
+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;
+ (ABI40_0_0RNSStatusBarStyle)ABI40_0_0RNSStatusBarStyle:(id)json;

@end

@interface ABI40_0_0RNSScreenStackHeaderSubviewManager : ABI40_0_0RCTViewManager

@property (nonatomic) ABI40_0_0RNSScreenStackHeaderSubviewType type;

@end
