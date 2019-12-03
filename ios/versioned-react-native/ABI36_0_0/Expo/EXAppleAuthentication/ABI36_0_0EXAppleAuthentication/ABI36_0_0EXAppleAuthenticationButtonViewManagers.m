// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCore/ABI36_0_0UMViewManager.h>
#import <ABI36_0_0EXAppleAuthentication/ABI36_0_0EXAppleAuthenticationButton.h>

@import AuthenticationServices;

// Below macro serves to generate ViewManager for each configuration of ASAuthorizationAppleIDButton
// ASAuthorizationAppleIDButton#style and ASAuthorizationAppleIDButton#type can only be specified at creation time

#define ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(type, style, module_name) \
@interface ABI36_0_0EXAppleAuthenticationButton ## type ## style ## ViewManager : ABI36_0_0UMViewManager @end \
\
@implementation ABI36_0_0EXAppleAuthenticationButton ## type ## style ## ViewManager \
\
  ABI36_0_0UM_REGISTER_MODULE(); \
\
  + (const NSString *)exportedModuleName { return @#module_name; } \
\
  - (NSString *)viewName { return @#module_name; } \
\
  - (UIView *)view { if (@available(iOS 13.0, *)) { return [[ABI36_0_0EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonType ## type authorizationButtonStyle:ASAuthorizationAppleIDButtonStyle ## style]; } else { return nil; } } \
\
  - (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; } \
\
  ABI36_0_0UM_VIEW_PROPERTY(cornerRadius, NSNumber *, ABI36_0_0EXAppleAuthenticationButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; } \
\
@end

// below commented code serves as template for above macro

//@interface ABI36_0_0EXAppleAuthenticationButtonSignInWhiteViewManager : ABI36_0_0UMViewManager @end
//
//@implementation ABI36_0_0EXAppleAuthenticationButtonSignInWhiteViewManager
//
//ABI36_0_0UM_REGISTER_MODULE();
//
//+ (const NSString *)exportedModuleName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (NSString *)viewName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (UIView *)view { if (@available(iOS 13.0, *)) { return [[ABI36_0_0EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonTypeSignIn authorizationButtonStyle:ASAuthorizationAppleIDButtonStyleWhite]; } else { return nil; } }
//
//- (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; }
//
//ABI36_0_0UM_VIEW_PROPERTY(cornerRadius, NSNumber *, ABI36_0_0EXAppleAuthenticationButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; }
//
//@end


# pragma mark - SignIn White

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, White, ExpoAppleAuthenticationButtonSignInWhite)


# pragma mark - SignIn WhiteOutline

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, WhiteOutline, ExpoAppleAuthenticationButtonSignInWhiteOutline)


# pragma mark - SignIn Black

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, Black, ExpoAppleAuthenticationButtonSignInBlack)


# pragma mark - Continue White

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, White, ExpoAppleAuthenticationButtonContinueWhite)


# pragma mark - Continue WhiteOutline

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, WhiteOutline, ExpoAppleAuthenticationButtonContinueWhiteOutline)


# pragma mark - Continue Black

ABI36_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, Black, ExpoAppleAuthenticationButtonContinueBlack)
