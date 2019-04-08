/// @file FIRUserPropertyNames.h
///
/// Predefined user property names.
///
/// A UserProperty is an attribute that describes the app-user. By supplying UserProperties, you can
/// later analyze different behaviors of various segments of your userbase. You may supply up to 25
/// unique UserProperties per app, and you can use the name and value of your choosing for each one.
/// UserProperty names can be up to 24 characters long, may only contain alphanumeric characters and
/// underscores ("_"), and must start with an alphabetic character. UserProperty values can be up to
/// 36 characters long. The "firebase_", "google_", and "ga_" prefixes are reserved and should not
/// be used.

#import <Foundation/Foundation.h>

/// The method used to sign in. For example, "google", "facebook" or "twitter".
static NSString *const kFIRUserPropertySignUpMethod
    NS_SWIFT_NAME(AnalyticsUserPropertySignUpMethod) = @"sign_up_method";
