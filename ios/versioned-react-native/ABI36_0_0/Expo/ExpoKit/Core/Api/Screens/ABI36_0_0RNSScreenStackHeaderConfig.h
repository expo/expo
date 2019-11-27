#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>

#import "ABI36_0_0RNSScreen.h"

@interface ABI36_0_0RNSScreenStackHeaderConfig : UIView

@property (nonatomic, weak) ABI36_0_0RNSScreenView *screenView;

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
@property (nonatomic) BOOL hideBackButton;
@property (nonatomic) BOOL hideShadow;
@property (nonatomic) BOOL translucent;
@property (nonatomic) BOOL gestureEnabled;

+ (void)willShowViewController:(UIViewController *)vc withConfig:(ABI36_0_0RNSScreenStackHeaderConfig*)config;

@end

@interface ABI36_0_0RNSScreenStackHeaderConfigManager : ABI36_0_0RCTViewManager

@end

typedef NS_ENUM(NSInteger, ABI36_0_0RNSScreenStackHeaderSubviewType) {
  ABI36_0_0RNSScreenStackHeaderSubviewTypeLeft,
  ABI36_0_0RNSScreenStackHeaderSubviewTypeRight,
  ABI36_0_0RNSScreenStackHeaderSubviewTypeTitle,
  ABI36_0_0RNSScreenStackHeaderSubviewTypeCenter,
};

@interface ABI36_0_0RCTConvert (ABI36_0_0RNSScreenStackHeader)

+ (ABI36_0_0RNSScreenStackHeaderSubviewType)ABI36_0_0RNSScreenStackHeaderSubviewType:(id)json;

@end

@interface ABI36_0_0RNSScreenStackHeaderSubviewManager : ABI36_0_0RCTViewManager

@property (nonatomic) ABI36_0_0RNSScreenStackHeaderSubviewType type;

@end
