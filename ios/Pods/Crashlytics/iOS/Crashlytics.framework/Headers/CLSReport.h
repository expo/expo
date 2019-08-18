//
//  CLSReport.h
//  Crashlytics
//
//  Copyright (c) 2015 Crashlytics, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "CLSAttributes.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * The CLSCrashReport protocol is deprecated. See the CLSReport class and the CrashyticsDelegate changes for details.
 **/
@protocol CLSCrashReport <NSObject>

@property (nonatomic, copy, readonly) NSString *identifier;
@property (nonatomic, copy, readonly) NSDictionary *customKeys;
@property (nonatomic, copy, readonly) NSString *bundleVersion;
@property (nonatomic, copy, readonly) NSString *bundleShortVersionString;
@property (nonatomic, readonly, nullable) NSDate *crashedOnDate;
@property (nonatomic, copy, readonly) NSString *OSVersion;
@property (nonatomic, copy, readonly) NSString *OSBuildVersion;

@end

/**
 * The CLSReport exposes an interface to the phsyical report that Crashlytics has created. You can
 * use this class to get information about the event, and can also set some values after the
 * event has occurred.
 **/
@interface CLSReport : NSObject <CLSCrashReport>

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
 * Returns the session identifier for the report.
 **/
@property (nonatomic, copy, readonly) NSString *identifier;

/**
 * Returns the custom key value data for the report.
 **/
@property (nonatomic, copy, readonly) NSDictionary *customKeys;

/**
 * Returns the CFBundleVersion of the application that generated the report.
 **/
@property (nonatomic, copy, readonly) NSString *bundleVersion;

/**
 * Returns the CFBundleShortVersionString of the application that generated the report.
 **/
@property (nonatomic, copy, readonly) NSString *bundleShortVersionString;

/**
 * Returns the date that the report was created.
 **/
@property (nonatomic, copy, readonly) NSDate *dateCreated;

/**
 * Returns the os version that the application crashed on.
 **/
@property (nonatomic, copy, readonly) NSString *OSVersion;

/**
 * Returns the os build version that the application crashed on.
 **/
@property (nonatomic, copy, readonly) NSString *OSBuildVersion;

/**
 * Returns YES if the report contains any crash information, otherwise returns NO.
 **/
@property (nonatomic, assign, readonly) BOOL isCrash;

/**
 * You can use this method to set, after the event, additional custom keys. The rules
 * and semantics for this method are the same as those documented in Crashlytics.h. Be aware
 * that the maximum size and count of custom keys is still enforced, and you can overwrite keys
 * and/or cause excess keys to be deleted by using this method.
 **/
- (void)setObjectValue:(nullable id)value forKey:(NSString *)key;

/**
 * Record an application-specific user identifier. See Crashlytics.h for details.
 **/
@property (nonatomic, copy, nullable) NSString * userIdentifier;

/**
 * Record a user name. See Crashlytics.h for details.
 **/
@property (nonatomic, copy, nullable) NSString * userName;

/**
 * Record a user email. See Crashlytics.h for details.
 **/
@property (nonatomic, copy, nullable) NSString * userEmail;

@end

NS_ASSUME_NONNULL_END
