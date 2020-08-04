#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>

#import "ABI38_0_0RNSScreen.h"

@interface ABI38_0_0RNSScreenStackHeaderConfig : UIView

@property (nonatomic, weak) ABI38_0_0RNSScreenView *screenView;

@property (nonatomic, retain) NSString *title;
@property (nonatomic, retain) NSString *titleFontFamily;
@property (nonatomic, retain) NSNumber *titleFontSize;
@property (nonatomic, retain) UIColor *titleColor;
@property (nonatomic, retain) NSString *backTitle;
@property (nonatomic, retain) NSString *backTitleFontFamily;
@property (nonatomic, retain) NSNumber *backTitleFontSize;
@property (nonatomic, retain) UIColor *backgroundColor;
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

+ (void)willShowViewController:(UIViewController *)vc animated:(BOOL)animated withConfig:(ABI38_0_0RNSScreenStackHeaderConfig*)config;

@end

@interface ABI38_0_0RNSScreenStackHeaderConfigManager : ABI38_0_0RCTViewManager

@end

typedef NS_ENUM(NSInteger, ABI38_0_0RNSScreenStackHeaderSubviewType) {
  ABI38_0_0RNSScreenStackHeaderSubviewTypeBackButton,
  ABI38_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI38_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI38_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI38_0_0RNSScreenStackHeaderSubviewTypeCenter,
};

@interface ABI38_0_0RCTConvert (ABI38_0_0RNSScreenStackHeader)

+ (ABI38_0_0RNSScreenStackHeaderSubviewType)ABI38_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

@interface ABI38_0_0RNSScreenStackHeaderSubviewManager : ABI38_0_0RCTViewManager

@property (nonatomic) ABI38_0_0RNSScreenStackHeaderSubviewType type;

@end
