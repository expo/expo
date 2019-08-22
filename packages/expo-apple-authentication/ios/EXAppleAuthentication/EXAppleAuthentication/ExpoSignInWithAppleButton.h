#import <React/RCTComponent.h>

@import AuthenticationServices;

API_AVAILABLE(ios(13.0))
@interface RNCSignInWithAppleButton : UIView

@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, copy) NSNumber *type;
@property (nonatomic, copy) NSNumber *style;
@property (nonatomic, copy) NSNumber *cornerRadius;

@end
