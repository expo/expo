//
//  GADDynamicHeightSearchRequest.h
//  GoogleMobileAds
//
//  Copyright © 2016 Google Inc. All rights reserved.
//

#import <GoogleMobileAds/GADRequest.h>
#import <GoogleMobileAds/GoogleMobileAdsDefines.h>

GAD_ASSUME_NONNULL_BEGIN

/// Use to configure Custom Search Ad (CSA) ad requests. A dynamic height search banner can contain
/// multiple ads and the height is set dynamically based on the ad contents. Please cross-reference
/// the property sections and properties with the official reference document:
/// https://developers.google.com/custom-search-ads/docs/reference
@interface GADDynamicHeightSearchRequest : GADRequest

#pragma mark - Page Level Parameters

#pragma mark Required

/// The CSA "query" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *query;

/// The CSA "adPage" parameter.
@property(nonatomic, assign) NSInteger adPage;

#pragma mark Configuration Settings

/// Indicates if the CSA "adTest" parameter is enabled.
@property(nonatomic, assign) BOOL adTestEnabled;

/// The CSA "channel" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *channel;

/// The CSA "hl" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *hostLanguage;

#pragma mark Layout and Styling

/// The CSA "colorLocation" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *locationExtensionTextColor;

/// The CSA "fontSizeLocation" parameter.
@property(nonatomic, assign) CGFloat locationExtensionFontSize;

#pragma mark Ad Extensions

/// Indicates if the CSA "clickToCall" parameter is enabled.
@property(nonatomic, assign) BOOL clickToCallExtensionEnabled;

/// Indicates if the CSA "location" parameter is enabled.
@property(nonatomic, assign) BOOL locationExtensionEnabled;

/// Indicates if the CSA "plusOnes" parameter is enabled.
@property(nonatomic, assign) BOOL plusOnesExtensionEnabled;

/// Indicates if the CSA "sellerRatings" parameter is enabled.
@property(nonatomic, assign) BOOL sellerRatingsExtensionEnabled;

/// Indicates if the CSA "siteLinks" parameter is enabled.
@property(nonatomic, assign) BOOL siteLinksExtensionEnabled;

#pragma mark - Unit Level Parameters

#pragma mark Required

/// The CSA "width" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *CSSWidth;

/// Configuration Settings

/// The CSA "number" parameter.
@property(nonatomic, assign) NSInteger numberOfAds;

#pragma mark Font

/// The CSA "fontFamily" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *fontFamily;

/// The CSA "fontFamilyAttribution" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *attributionFontFamily;

/// The CSA "fontSizeAnnotation" parameter.
@property(nonatomic, assign) CGFloat annotationFontSize;

/// The CSA "fontSizeAttribution" parameter.
@property(nonatomic, assign) CGFloat attributionFontSize;

/// The CSA "fontSizeDescription" parameter.
@property(nonatomic, assign) CGFloat descriptionFontSize;

/// The CSA "fontSizeDomainLink" parameter.
@property(nonatomic, assign) CGFloat domainLinkFontSize;

/// The CSA "fontSizeTitle" parameter.
@property(nonatomic, assign) CGFloat titleFontSize;

#pragma mark Color

/// The CSA "colorAdBorder" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *adBorderColor;

/// The CSA "colorAdSeparator" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *adSeparatorColor;

/// The CSA "colorAnnotation" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *annotationTextColor;

/// The CSA "colorAttribution" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *attributionTextColor;

/// The CSA "colorBackground" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *backgroundColor;

/// The CSA "colorBorder" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *borderColor;

/// The CSA "colorDomainLink" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *domainLinkColor;

/// The CSA "colorText" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *textColor;

/// The CSA "colorTitleLink" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *titleLinkColor;

#pragma mark General Formatting

/// The CSA "adBorderSelections" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *adBorderCSSSelections;

/// The CSA "adjustableLineHeight" parameter.
@property(nonatomic, assign) CGFloat adjustableLineHeight;

/// The CSA "attributionSpacingBelow" parameter.
@property(nonatomic, assign) CGFloat attributionBottomSpacing;

/// The CSA "borderSelections" parameter.
@property(nonatomic, copy, GAD_NULLABLE) NSString *borderCSSSelections;

/// Indicates if the CSA "noTitleUnderline" parameter is enabled.
@property(nonatomic, assign) BOOL titleUnderlineHidden;

/// Indicates if the CSA "titleBold" parameter is enabled.
@property(nonatomic, assign) BOOL boldTitleEnabled;

/// The CSA "verticalSpacing" parameter.
@property(nonatomic, assign) CGFloat verticalSpacing;

#pragma mark Ad Extensions

/// Indicates if the CSA "detailedAttribution" parameter is enabled.
@property(nonatomic, assign) BOOL detailedAttributionExtensionEnabled;

/// Indicates if the CSA "longerHeadlines" parameter is enabled.
@property(nonatomic, assign) BOOL longerHeadlinesExtensionEnabled;

/// Sets an advanced option value for a specified key. The value must be an NSString or NSNumber.
- (void)setAdvancedOptionValue:(id)value forKey:(NSString *)key;

@end

GAD_ASSUME_NONNULL_END
