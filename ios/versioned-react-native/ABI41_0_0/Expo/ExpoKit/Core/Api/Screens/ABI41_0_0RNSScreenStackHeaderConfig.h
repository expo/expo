#import <ABI41_0_0React/ABI41_0_0RCTViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTConvert.h>

#import "ABI41_0_0RNSScreen.h"

typedef NS_ENUM(NSInteger, ABI41_0_0RNSStatusBarStyle) {
  ABI41_0_0RNSStatusBarStyleAuto,
  ABI41_0_0RNSStatusBarStyleInverted,
  ABI41_0_0RNSStatusBarStyleLight,
  ABI41_0_0RNSStatusBarStyleDark,
};

@interface ABI41_0_0RNSScreenStackHeaderConfig : UIView

@property (nonatomic, weak) ABI41_0_0RNSScreenView *screenView;

@property (nonatomic, retain) NSString *title;
@property (nonatomic, retain) NSString *titleFontFamily;
@property (nonatomic, retain) NSNumber *titleFontSize;
@property (nonatomic, retain) NSString *titleFontWeight;
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
@property (nonatomic, retain) NSString *largeTitleFontWeight;
@property (nonatomic, retain) UIColor *largeTitleBackgroundColor;
@property (nonatomic) BOOL largeTitleHideShadow;
@property (nonatomic, retain) UIColor *largeTitleColor;
@property (nonatomic) BOOL hideBackButton;
@property (nonatomic) BOOL backButtonInCustomView;
@property (nonatomic) BOOL hideShadow;
@property (nonatomic) BOOL translucent;
@property (nonatomic) UISemanticContentAttribute direction;

#if !TARGET_OS_TV
@property (nonatomic) ABI41_0_0RNSStatusBarStyle statusBarStyle;
@property (nonatomic) UIStatusBarAnimation statusBarAnimation;
@property (nonatomic) BOOL statusBarHidden;
@property (nonatomic) UIInterfaceOrientationMask screenOrientation;
#endif

+ (void)willShowViewController:(UIViewController *)vc animated:(BOOL)animated withConfig:(ABI41_0_0RNSScreenStackHeaderConfig*)config;
+ (void)updateWindowTraits;

#if !TARGET_OS_TV
+ (UIStatusBarStyle)statusBarStyleForRNSStatusBarStyle:(ABI41_0_0RNSStatusBarStyle)statusBarStyle;
+ (UIInterfaceOrientation)defaultOrientationForOrientationMask:(UIInterfaceOrientationMask)orientationMask;
+ (UIInterfaceOrientation)interfaceOrientationFromDeviceOrientation:(UIDeviceOrientation)deviceOrientation;
+ (UIInterfaceOrientationMask)maskFromOrientation:(UIInterfaceOrientation)orientation;
#endif

@end

@interface ABI41_0_0RNSScreenStackHeaderConfigManager : ABI41_0_0RCTViewManager

@end

typedef NS_ENUM(NSInteger, ABI41_0_0RNSScreenStackHeaderSubviewType) {
  ABI41_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI41_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI41_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI41_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI41_0_0RNSScreenStackHeaderSubviewTypeCenter,
};

@interface ABI41_0_0RCTConvert (ABI41_0_0RNSScreenStackHeader)

+ (ABI41_0_0RNSScreenStackHeaderSubviewType)ABI41_0_0RNSScreenStackHeaderSubviewType:(id)json;
+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;

#if !TARGET_OS_TV
+ (ABI41_0_0RNSStatusBarStyle)ABI41_0_0RNSStatusBarStyle:(id)json;
+ (UIInterfaceOrientationMask)UIInterfaceOrientationMask:(id)json;
#endif

@end

@interface ABI41_0_0RNSScreenStackHeaderSubviewManager : ABI41_0_0RCTViewManager

@property (nonatomic) ABI41_0_0RNSScreenStackHeaderSubviewType type;

@end
