#import <ABI43_0_0React/ABI43_0_0RCTConvert.h>
#import <ABI43_0_0React/ABI43_0_0RCTViewManager.h>

#import "ABI43_0_0RNSScreen.h"
#import "ABI43_0_0RNSSearchBar.h"

@interface ABI43_0_0RNSScreenStackHeaderConfig : UIView

@property (nonatomic, weak) ABI43_0_0RNSScreenView *screenView;

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
@property (nonatomic) BOOL disableBackButtonMenu;
@property (nonatomic) BOOL hideShadow;
@property (nonatomic) BOOL translucent;
@property (nonatomic) UISemanticContentAttribute direction;

+ (void)willShowViewController:(UIViewController *)vc
                      animated:(BOOL)animated
                    withConfig:(ABI43_0_0RNSScreenStackHeaderConfig *)config;

@end

@interface ABI43_0_0RNSScreenStackHeaderConfigManager : ABI43_0_0RCTViewManager

@end

typedef NS_ENUM(NSInteger, ABI43_0_0RNSScreenStackHeaderSubviewType) {
  ABI43_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI43_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI43_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI43_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI43_0_0RNSScreenStackHeaderSubviewTypeCenter,
  ABI43_0_0RNSScreenStackHeaderSubviewTypeSearchBar,
};

@interface ABI43_0_0RCTConvert (ABI43_0_0RNSScreenStackHeader)

+ (ABI43_0_0RNSScreenStackHeaderSubviewType)ABI43_0_0RNSScreenStackHeaderSubviewType:(id)json;
+ (UIBlurEffectStyle)UIBlurEffectStyle:(id)json;
+ (UISemanticContentAttribute)UISemanticContentAttribute:(id)json;

@end

@interface ABI43_0_0RNSScreenStackHeaderSubviewManager : ABI43_0_0RCTViewManager

@property (nonatomic) ABI43_0_0RNSScreenStackHeaderSubviewType type;

@end
