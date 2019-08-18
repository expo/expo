//
//  GADCustomEventRequest.h
//  Google Mobile Ads SDK
//
//  Copyright 2012 Google Inc. All rights reserved.
//

#import <UIKit/UIKit.h>

#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

@class GADCustomEventExtras;

GAD_ASSUME_NONNULL_BEGIN

/// Specifies optional ad request targeting parameters that are provided by the publisher and are
/// forwarded to custom events for purposes of populating an ad request to a 3rd party ad network.
@interface GADCustomEventRequest : NSObject

/// User's gender set in GADRequest. If not specified, returns kGADGenderUnknown.
@property(nonatomic, readonly, assign) GADGender userGender;

/// User's birthday set in GADRequest. If not specified, returns nil.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSDate *userBirthday;

/// If the user's latitude, longitude, and accuracy are not specified, userHasLocation returns NO,
/// and userLatitude, userLongitude, and userLocationAccuracyInMeters return 0.
@property(nonatomic, readonly, assign) BOOL userHasLocation;

/// User's latitude set in GADRequest.
@property(nonatomic, readonly, assign) CGFloat userLatitude;

/// User's longitude set in GADRequest.
@property(nonatomic, readonly, assign) CGFloat userLongitude;

/// The accuracy, in meters, of the user's location data.
@property(nonatomic, readonly, assign) CGFloat userLocationAccuracyInMeters;

/// Description of the user's location, in free form text, set in GADRequest. If not available,
/// returns nil. This may be set even if userHasLocation is NO.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSString *userLocationDescription;

/// Keywords set in GADRequest. Returns nil if no keywords are set.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSArray *userKeywords;

/// The additional parameters set by the application. This property allows you to pass additional
/// information from your application to your Custom Event object. To do so, create an instance of
/// GADCustomEventExtras to pass to GADRequest -registerAdNetworkExtras:. The instance should have
/// an NSDictionary set for a particular custom event label. That NSDictionary becomes the
/// additionalParameters here.
@property(nonatomic, readonly, copy, GAD_NULLABLE) NSDictionary *additionalParameters;

/// Indicates if the testing property has been set in GADRequest.
@property(nonatomic, readonly, assign) BOOL isTesting;

@end

GAD_ASSUME_NONNULL_END
