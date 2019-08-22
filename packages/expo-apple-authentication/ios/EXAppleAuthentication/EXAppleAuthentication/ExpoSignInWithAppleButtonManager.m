#import <React/RCTViewManager.h>
#import <React/RCTUtils.h>
#import "RNCSignInWithAppleButton.h"
@import AuthenticationServices;

@interface RNCSignInWithAppleButtonManager : RCTViewManager
@end

@implementation RNCSignInWithAppleButtonManager

RCT_EXPORT_MODULE(RNCSignInWithAppleButtonManager)

- (UIView *)view
{
  return [RNCSignInWithAppleButton new];
}

RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

RCT_CUSTOM_VIEW_PROPERTY(buttonType, NSNumber *, RNCSignInWithAppleButton)
{
  [view setType:json];
}

RCT_CUSTOM_VIEW_PROPERTY(buttonStyle, NSNumber *, RNCSignInWithAppleButton)
{
  [view setStyle:json];
}

RCT_CUSTOM_VIEW_PROPERTY(cornerRadius, NSNumber *, RNCSignInWithAppleButton)
{
  [view setCornerRadius:json];
}

@end
