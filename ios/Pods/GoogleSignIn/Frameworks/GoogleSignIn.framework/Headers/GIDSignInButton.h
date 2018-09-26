/*
 * GIDSignInButton.h
 * Google Sign-In iOS SDK
 *
 * Copyright 2012 Google Inc.
 *
 * Use of this SDK is subject to the Google APIs Terms of Service:
 * https://developers.google.com/terms/
 */

#import <UIKit/UIKit.h>

// The various layout styles supported by the GIDSignInButton.
// The minimum size of the button depends on the language used for text.
// The following dimensions (in points) fit for all languages:
// kGIDSignInButtonStyleStandard: 230 x 48
// kGIDSignInButtonStyleWide:     312 x 48
// kGIDSignInButtonStyleIconOnly: 48 x 48 (no text, fixed size)
typedef NS_ENUM(NSInteger, GIDSignInButtonStyle) {
  kGIDSignInButtonStyleStandard = 0,
  kGIDSignInButtonStyleWide = 1,
  kGIDSignInButtonStyleIconOnly = 2
};

// The various color schemes supported by the GIDSignInButton.
typedef NS_ENUM(NSInteger, GIDSignInButtonColorScheme) {
  kGIDSignInButtonColorSchemeDark = 0,
  kGIDSignInButtonColorSchemeLight = 1
};

// This class provides the "Sign in with Google" button. You can instantiate this
// class programmatically or from a NIB file.  You should set up the
// |GIDSignIn| shared instance with your client ID and any additional scopes,
// implement the delegate methods for |GIDSignIn|, and add this button to your
// view hierarchy.
@interface GIDSignInButton : UIControl

// The layout style for the sign-in button.
// Possible values:
// - kGIDSignInButtonStyleStandard: 230 x 48 (default)
// - kGIDSignInButtonStyleWide:     312 x 48
// - kGIDSignInButtonStyleIconOnly: 48 x 48 (no text, fixed size)
@property(nonatomic, assign) GIDSignInButtonStyle style;

// The color scheme for the sign-in button.
// Possible values:
// - kGIDSignInButtonColorSchemeDark
// - kGIDSignInButtonColorSchemeLight (default)
@property(nonatomic, assign) GIDSignInButtonColorScheme colorScheme;

@end
