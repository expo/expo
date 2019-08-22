// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMCore/UMViewManager.h>
#import <EXAppleAuthentication/EXSignInWithAppleButton.h>

@import AuthenticationServices;

// Below macro serves to generate ViewManager for each configuration of ASAuthorizationAppleIDButton
// ASAuthorizationAppleIDButton#style and ASAuthorizationAppleIDButton#type can only be specified at creation time

#define EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(type, style, module_name) \
@interface EXSignInWithAppleButton ## type ## style ## ViewManager : UMViewManager @end \
\
@implementation EXSignInWithAppleButton ## type ## style ## ViewManager \
\
  UM_REGISTER_MODULE(); \
\
  + (const NSString *)exportedModuleName { return @#module_name; } \
\
  - (NSString *)viewName { return @#module_name; } \
\
  - (UIView *)view { if (@available(iOS 13.0, *)) { return [[EXSignInWithAppleButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonType ## type authorizationButtonStyle:ASAuthorizationAppleIDButtonStyle ## style]; } else { return nil; } } \
\
  - (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; } \
\
  UM_VIEW_PROPERTY(cornerRadius, NSNumber *, EXSignInWithAppleButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; } \
\
@end

// below commented code serves as template for above macro

//@interface EXSignInWithAppleButtonSignInWhiteViewManager : UMViewManager @end
//
//@implementation EXSignInWithAppleButtonSignInWhiteViewManager
//
//UM_REGISTER_MODULE();
//
//+ (const NSString *)exportedModuleName { return @"ExpoSignInWithAppleButtonSignInWhite"; }
//
//- (NSString *)viewName { return @"ExpoSignInWithAppleButtonSignInWhite"; }
//
//- (UIView *)view { if (@available(iOS 13.0, *)) { return [[EXSignInWithAppleButton alloc] initWithAuthorizationButtonType:ASAuthorizationAppleIDButtonTypeSignIn authorizationButtonStyle:ASAuthorizationAppleIDButtonStyleWhite]; } else { return nil; } }
//
//- (NSArray<NSString *> *)supportedEvents { return @[@"onButtonPress"]; }
//
//UM_VIEW_PROPERTY(cornerRadius, NSNumber *, EXSignInWithAppleButton) API_AVAILABLE(ios(13.0)) { view.cornerRadius = [value floatValue]; }
//
//@end


# pragma mark - SignIn White

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(SignIn, White, ExpoSignInWithAppleButtonSignInWhite)


# pragma mark - SignIn WhiteOutline

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(SignIn, WhiteOutline, ExpoSignInWithAppleButtonSignInWhiteOutline)


# pragma mark - SignIn Black

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(SignIn, Black, ExpoSignInWithAppleButtonSignInBlack)


# pragma mark - Continue White

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(Continue, White, ExpoSignInWithAppleButtonContinueWhite)


# pragma mark - Continue WhiteOutline

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(Continue, WhiteOutline, ExpoSignInWithAppleButtonContinueWhiteOutline)


# pragma mark - Continue Black

EX_REGISTER_SIGN_IN_WITH_APPLE_VIEW_MANAGER(Continue, Black, ExpoSignInWithAppleButtonContinueBlack)
