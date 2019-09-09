// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMViewManager.h>
#import <EXAppleAuthentication/EXAppleAuthenticationButton.h>

@import AuthenticationServices;

// Below macro serves to generate ViewManager for each configuration of ASAuthorizationAppleIDButton
// ASAuthorizationAppleIDButton#style and ASAuthorizationAppleIDButton#type can only be specified at creation time

#define EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(type, style, module_name) \
@interface EXAppleAuthenticationButton ## type ## style ## ViewManager : UMViewManager @end \
\
@implementation EXAppleAuthenticationButton ## type ## style ## ViewManager \
\
  UM_REGISTER_MODULE(); \
\
  + (const NSString *)exportedModuleName { return @#module_name; } \
\
  - (NSString *)viewName { return @#module_name; } \
\
  - (UIView *)view { if (@available(iOS 13.0, *)) { return [[EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonType ## type authorizationButtonStyle:ASAuthorizationAppleIDButtonStyle ## style]; } else { return nil; } } \
\
  - (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; } \
\
  UM_VIEW_PROPERTY(cornerRadius, NSNumber *, EXAppleAuthenticationButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; } \
\
@end

// below commented code serves as template for above macro

//@interface EXAppleAuthenticationButtonSignInWhiteViewManager : UMViewManager @end
//
//@implementation EXAppleAuthenticationButtonSignInWhiteViewManager
//
//UM_REGISTER_MODULE();
//
//+ (const NSString *)exportedModuleName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (NSString *)viewName { return @"ExpoAppleAuthenticationButtonSignInWhite"; }
//
//- (UIView *)view { if (@available(iOS 13.0, *)) { return [[EXAppleAuthenticationButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonTypeSignIn authorizationButtonStyle:ASAuthorizationAppleIDButtonStyleWhite]; } else { return nil; } }
//
//- (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; }
//
//UM_VIEW_PROPERTY(cornerRadius, NSNumber *, EXAppleAuthenticationButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; }
//
//@end


# pragma mark - SignIn White

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, White, ExpoAppleAuthenticationButtonSignInWhite)


# pragma mark - SignIn WhiteOutline

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, WhiteOutline, ExpoAppleAuthenticationButtonSignInWhiteOutline)


# pragma mark - SignIn Black

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(SignIn, Black, ExpoAppleAuthenticationButtonSignInBlack)


# pragma mark - Continue White

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, White, ExpoAppleAuthenticationButtonContinueWhite)


# pragma mark - Continue WhiteOutline

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, WhiteOutline, ExpoAppleAuthenticationButtonContinueWhiteOutline)


# pragma mark - Continue Black

EX_REGISTER_APPLE_AUTHENTICATION_VIEW_MANAGER(Continue, Black, ExpoAppleAuthenticationButtonContinueBlack)
