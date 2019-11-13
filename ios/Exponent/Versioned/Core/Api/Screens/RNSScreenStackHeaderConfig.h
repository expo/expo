#import <React/RCTViewManager.h>
#import <React/RCTConvert.h>

@interface RNSScreenStackHeaderConfig : UIView

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

+ (void)willShowViewController:(UIViewController *)vc withConfig:(RNSScreenStackHeaderConfig*)config;

@end

@interface RNSScreenStackHeaderConfigManager : RCTViewManager

@end

typedef NS_ENUM(NSInteger, RNSScreenStackHeaderSubviewType) {
  RNSScreenStackHeaderSubviewTypeLeft,
  RNSScreenStackHeaderSubviewTypeRight,
  RNSScreenStackHeaderSubviewTypeTitle,
  RNSScreenStackHeaderSubviewTypeCenter,
};

@interface RCTConvert (RNSScreenStackHeader)

+ (RNSScreenStackHeaderSubviewType)RNSScreenStackHeaderSubviewType:(id)json;

@end

@interface RNSScreenStackHeaderSubviewManager : RCTViewManager

@property (nonatomic) RNSScreenStackHeaderSubviewType type;

@end
