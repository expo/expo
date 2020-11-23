// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCore/ABI40_0_0UMViewManager.h>
#import <ABI40_0_0EXAppleAuthentication/ABI40_0_0EXAppleAuthenticationButton.h>

@import AuthenticationServices;

// Below macro serves to generate ViewManager for each configuration of ASAuthorizationAppleIDButton
// ASAuthorizationAppleIDButton#style and ASAuthorizationAppleIDButton#type can only be specified at creation time

#define ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(type, style, module_name, ios_version) \
@interface ABI40_0_0EXAppleAuthenticationButton ## type ## style ## ViewManager : ABI40_0_0UMViewManager @end \
\
@implementation ABI40_0_0EXAppleAuthenticationButton ## type ## style ## ViewManager \
\
  ABI40_0_0UM_REGISTER_MODULE(); \
\
  + (const NSString *)exportedModuleName { return @#module_name; } \
\
  - (NSString *)viewName { return @#module_name; } \
\
  - (UIView *)view { if (@available(iOS ios_version, *)) { return [[ABI40_0_0EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonType ## type authorizationButtonStyle:ASAuthorizationAppleIDButtonStyle ## style]; } else { return nil; } } \
\
  - (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; } \
\
  ABI40_0_0UM_VIEW_PROPERTY(cornerRadius, NSNumber *, ABI40_0_0EXAppleAuthenticationButton) API_AVAILABLE(ios(ios_version)) { view.cornerRadius = [value floatValue]; } \
\
@end

// below commented code serves as template for above macro

//@interface ABI40_0_0EXAppleAuthenticationButtonSignInWhiteViewManager : ABI40_0_0UMViewManager @end
//
//@implementation ABI40_0_0EXAppleAuthenticationButtonSignInWhiteViewManager
//
//ABI40_0_0UM_REGISTER_MODULE();
//
//+ (const NSString *)exportedModuleName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (NSString *)viewName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (UIView *)view { if (@available(iOS 13.0, *)) { return [[ABI40_0_0EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonTypeSignIn authorizationButtonStyle:ASAuthorizationAppleIDButtonStyleWhite]; } else { return nil; } }
//
//- (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; }
//
//ABI40_0_0UM_VIEW_PROPERTY(cornerRadius, NSNumber *, ABI40_0_0EXAppleAuthenticationButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; }
//
//@end


# pragma mark - SignIn White

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, White, ExpoAppleAuthenticationButtonSignInWhite, 13.0)


# pragma mark - SignIn WhiteOutline

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, WhiteOutline, ExpoAppleAuthenticationButtonSignInWhiteOutline, 13.0)


# pragma mark - SignIn Black

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, Black, ExpoAppleAuthenticationButtonSignInBlack, 13.0)


# pragma mark - Continue White

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, White, ExpoAppleAuthenticationButtonContinueWhite, 13.0)


# pragma mark - Continue WhiteOutline

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, WhiteOutline, ExpoAppleAuthenticationButtonContinueWhiteOutline, 13.0)


# pragma mark - Continue Black

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, Black, ExpoAppleAuthenticationButtonContinueBlack, 13.0)


# pragma mark - SignUp White

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignUp, White, ExpoAppleAuthenticationButtonSignUpWhite, 13.2)


# pragma mark - SignUp WhiteOutline

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignUp, WhiteOutline, ExpoAppleAuthenticationButtonSignUpWhiteOutline, 13.2)


# pragma mark - SignUp Black

ABI40_0_0EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignUp, Black, ExpoAppleAuthenticationButtonSignUpBlack, 13.2)
