/**
 @file          BNCApplication.h
 @package       Branch-SDK
 @brief         Current application and extension info.

 @author        Edward Smith
 @date          January 8, 2018
 @copyright     Copyright © 2018 Branch. All rights reserved.
*/

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCApplication : NSObject

+ (void)loadCurrentApplicationWithCompletion:(void (^_Nullable)(BNCApplication * _Nonnull application))completion;

/// A reference to the current running application.
+ (BNCApplication*_Nonnull) currentApplication;

/// The bundle identifier of the current
@property (atomic, readonly) NSString*_Nullable bundleID;

/// The bundle display name from the info plist.
@property (atomic, readonly) NSString*_Nullable displayName;

/// The bundle short display name from the info plist.
@property (atomic, readonly) NSString*_Nullable shortDisplayName;

/// The short version ID as is typically shown to the user, like in iTunes or the app store.
@property (atomic, readonly) NSString*_Nullable displayVersionString;

/// The version ID for developers use.
@property (atomic, readonly) NSString*_Nullable versionString;

/// The creation date of the current executable.
@property (atomic, readonly) NSDate*_Nullable currentBuildDate;

/// The creating date of the exectuble the first time it was recorded by Branch.
@property (atomic, readonly) NSDate*_Nullable firstInstallBuildDate;

/// The date this app was installed on this device.
@property (atomic, readonly) NSDate*_Nullable currentInstallDate;

/// The date this app was first installed on this device.
@property (atomic, readonly) NSDate*_Nullable firstInstallDate;

/// Returns a dictionary of device / identity pairs.
@property (atomic, readonly) NSDictionary<NSString*, NSString*>*_Nonnull deviceKeyIdentityValueDictionary;

/// The team identifier for the app.
@property (atomic, readonly) NSString*_Nullable teamID;

@end
