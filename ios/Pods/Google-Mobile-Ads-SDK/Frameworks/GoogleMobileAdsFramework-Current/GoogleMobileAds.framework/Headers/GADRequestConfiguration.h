//
//  GADRequestConfiguration.h
//  Google Mobile Ads SDK
//
//  Copyright 2018 Google LLC. All rights reserved.
//

#import <Foundation/Foundation.h>

#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

/// Maximum ad content rating.
typedef NSString *GADMaxAdContentRating NS_STRING_ENUM;

/// Rating for content suitable for general audiences, including families.
GAD_EXTERN GADMaxAdContentRating _Nonnull const GADMaxAdContentRatingGeneral;
/// Rating for content suitable for most audiences with parental guidance.
GAD_EXTERN GADMaxAdContentRating _Nonnull const GADMaxAdContentRatingParentalGuidance;
/// Rating for content suitable for teen and older audiences.
GAD_EXTERN GADMaxAdContentRating _Nonnull const GADMaxAdContentRatingTeen;
/// Rating for content suitable only for mature audiences.
GAD_EXTERN GADMaxAdContentRating _Nonnull const GADMaxAdContentRatingMatureAudience;

/// Request configuration. The settings in this class will apply to all ad requests.
@interface GADRequestConfiguration : NSObject

/// The maximum ad content rating. All Google ads will have this content rating or lower.
@property(nonatomic, copy, nullable) GADMaxAdContentRating maxAdContentRating;

/// This method allows you to specify whether the user is under the age of consent.
/// https://developers.google.com/admob/ios/targeting#users_under_the_age_of_consent.
///
/// If you call this method with YES, a TFUA parameter will be included in all ad requests. This
/// parameter disables personalized advertising, including remarketing, for all ad requests. It also
/// disables requests to third-party ad vendors, such as ad measurement pixels and third-party ad
/// servers.
- (void)tagForUnderAgeOfConsent:(BOOL)underAgeOfConsent;

/// [Optional] This method allows you to specify whether you would like your app to be treated as
/// child-directed for purposes of the Children’s Online Privacy Protection Act (COPPA),
/// http://business.ftc.gov/privacy-and-security/childrens-privacy.
///
/// If you call this method with YES, you are indicating that your app should be treated as
/// child-directed for purposes of the Children’s Online Privacy Protection Act (COPPA). If you call
/// this method with NO, you are indicating that your app should not be treated as child-directed
/// for purposes of the Children’s Online Privacy Protection Act (COPPA). If you do not call this
/// method, ad requests will include no indication of how you would like your app treated with
/// respect to COPPA.
///
/// By setting this method, you certify that this notification is accurate and you are authorized to
/// act on behalf of the owner of the app. You understand that abuse of this setting may result in
/// termination of your Google account.
- (void)tagForChildDirectedTreatment:(BOOL)childDirectedTreatment;

@end
