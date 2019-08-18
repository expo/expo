//
//  BranchUniversalObject.h
//  Branch-SDK
//
//  Created by Derrick Staten on 10/16/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import UIKit;
@import CoreSpotlight;
#else
#import <UIKit/UIKit.h>
#import <CoreSpotlight/CoreSpotlight.h>
#endif

#import "BNCCommerceEvent.h"
@class BranchLinkProperties;

#pragma mark BranchContentIndexMode

typedef NS_ENUM(NSInteger, BranchContentIndexMode) {
    BranchContentIndexModePublic,
    BranchContentIndexModePrivate
};

#pragma mark - BranchContentSchema

typedef NSString * const BranchContentSchema NS_STRING_ENUM;

FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceAuction;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceBusiness;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceOther;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceProduct;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceRestaurant;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceService;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelFlight;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelHotel;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelOther;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaGameState;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaMediaImage;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaMediaMixed;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaMediaMusic;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaMediaOther;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaMediaVideo;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaOther;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextArticle;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextBlog;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextOther;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextRecipe;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextReview;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextSearchResults;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextStory;
FOUNDATION_EXPORT BranchContentSchema _Nonnull BranchContentSchemaTextTechnicalDoc;

#pragma mark - BranchCondition

typedef NSString * const BranchCondition NS_STRING_ENUM;

FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionOther;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionNew;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionExcellent;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionGood;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionFair;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionPoor;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionUsed;
FOUNDATION_EXPORT BranchCondition _Nonnull BranchConditionRefurbished;

#pragma mark - BranchContentMetadata

@interface BranchContentMetadata : NSObject

@property (nonatomic, strong, nullable) BranchContentSchema contentSchema;
@property (nonatomic, assign)           double          quantity;
@property (nonatomic, strong, nullable) NSDecimalNumber *price;
@property (nonatomic, strong, nullable) BNCCurrency     currency;
@property (nonatomic, strong, nullable) NSString        *sku;
@property (nonatomic, strong, nullable) NSString        *productName;
@property (nonatomic, strong, nullable) NSString        *productBrand;
@property (nonatomic, strong, nullable) BNCProductCategory productCategory;
@property (nonatomic, strong, nullable) NSString        *productVariant;
@property (nonatomic, strong, nullable) BranchCondition condition;
@property (nonatomic, assign)           double          ratingAverage;
@property (nonatomic, assign)           NSInteger       ratingCount;
@property (nonatomic, assign)           double          ratingMax;
@property (nonatomic, assign)           double          rating;
@property (nonatomic, strong, nullable) NSString        *addressStreet;
@property (nonatomic, strong, nullable) NSString        *addressCity;
@property (nonatomic, strong, nullable) NSString        *addressRegion;
@property (nonatomic, strong, nullable) NSString        *addressCountry;
@property (nonatomic, strong, nullable) NSString        *addressPostalCode;
@property (nonatomic, assign)           double          latitude;
@property (nonatomic, assign)           double          longitude;
@property (nonatomic, copy, nonnull)    NSMutableArray<NSString*> *imageCaptions;
@property (nonatomic, copy, nonnull)    NSMutableDictionary<NSString*, NSString*> *customMetadata;

- (NSDictionary*_Nonnull) dictionary;
+ (BranchContentMetadata*_Nonnull) contentMetadataWithDictionary:(NSDictionary*_Nullable)dictionary;

@end

#pragma mark - BranchUniversalObject

@interface BranchUniversalObject : NSObject

- (nonnull instancetype)initWithCanonicalIdentifier:(nonnull NSString *)canonicalIdentifier;
- (nonnull instancetype)initWithTitle:(nonnull NSString *)title;

@property (nonatomic, strong, nullable) NSString *canonicalIdentifier;
@property (nonatomic, strong, nullable) NSString *canonicalUrl;
@property (nonatomic, strong, nullable) NSString *title;
@property (nonatomic, strong, nullable) NSString *contentDescription;
@property (nonatomic, strong, nullable) NSString *imageUrl;
@property (nonatomic, strong, nullable) NSArray<NSString*> *keywords;
@property (nonatomic, strong, nullable) NSDate   *creationDate;
@property (nonatomic, strong, nullable) NSDate   *expirationDate;
@property (nonatomic, assign)           BOOL      locallyIndex;     //!< Index on Spotlight.
@property (nonatomic, assign)           BOOL      publiclyIndex;    //!< Index on Google, Branch, etc.

@property (nonatomic, strong, nonnull) BranchContentMetadata *contentMetadata;

///@name Deprecated Properties

@property (nonatomic, strong, nullable)
    __attribute__((deprecated(("Use `BranchUniversalObject.contentMetadata.customMetadata` instead."))))
    NSDictionary *metadata;

- (void)addMetadataKey:(nonnull NSString *)key value:(nonnull NSString *)value
    __attribute__((deprecated(("Use `BranchUniversalObject.contentMetadata.customMetadata` instead."))));

@property (nonatomic, strong, nullable)
    __attribute__((deprecated(("Use `BranchUniversalObject.contentMetadata.contentSchema` instead."))))
    NSString *type;

@property (nonatomic, assign)
    __attribute__((deprecated(("Use `BranchUniversalObject.locallyIndex and BranchUniversalObject.publiclyIndex` instead."))))
    BranchContentIndexMode contentIndexMode;

@property (nonatomic, strong, nullable)
    __attribute__((deprecated(("Not used due to iOS 10.0 Spotlight changes."))))
    NSString *spotlightIdentifier;

@property (nonatomic, assign)
    __attribute__((deprecated(("Use `BranchUniversalObject.contentMetadata.price` instead."))))
    CGFloat price;

@property (nonatomic, strong, nullable)
    __attribute__((deprecated(("Use `BranchUniversalObject.contentMetadata.currency` instead."))))
    NSString *currency;

@property (nonatomic, assign)
    __attribute__((deprecated(("Use `BranchUniversalObject.locallyIndex` instead."))))
    BOOL automaticallyListOnSpotlight;


/// @name Log a User Content View Event


- (void)registerView;
- (void)registerViewWithCallback:(void (^_Nullable)(NSDictionary * _Nullable params, NSError * _Nullable error))callback;


/// @name User Event Tracking


- (void)userCompletedAction:(nonnull NSString *)action;
    // __attribute__((deprecated(("Use `[BranchEvent logEvent...]` instead."))));

- (void)userCompletedAction:(nonnull NSString *)action withState:(nullable NSDictionary *)state;
    // __attribute__((deprecated(("Use `[BranchEvent logEvent...]` instead."))));


/// @name Short Links


/// Returns a Branch short URL to the content item with the passed link properties.
- (nullable NSString *)getShortUrlWithLinkProperties:(nonnull BranchLinkProperties *)linkProperties;

/// Returns a Branch short URL to the content item with the passed link properties.
/// Ignores the first access of the item (usually due to a robot indexing the item) for statistics.
- (nullable NSString *)getShortUrlWithLinkPropertiesAndIgnoreFirstClick:(nonnull BranchLinkProperties *)linkProperties;

/// Returns a Branch short URL to the content item with the passed link properties with a callback.
- (void)getShortUrlWithLinkProperties:(nonnull BranchLinkProperties *)linkProperties
                          andCallback:(void (^_Nullable)(NSString * _Nullable url, NSError * _Nullable error))callback;

/// Returns a Branch long URL to the content item
- (nullable NSString *)getLongUrlWithChannel:(nullable NSString *)channel
                                     andTags:(nullable NSArray *)tags
                                  andFeature:(nullable NSString *)feature
                                    andStage:(nullable NSString *)stage
                                    andAlias:(nullable NSString *)alias;

/// @name Share Sheet Handling


- (nullable UIActivityItemProvider *)getBranchActivityItemWithLinkProperties:(nonnull BranchLinkProperties *)linkProperties;

- (void)showShareSheetWithShareText:(nullable NSString *)shareText
                         completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion;

- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                              completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion;

/// Returns with activityError as well
- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                     completionWithError:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed, NSError*_Nullable error))completion;

// iPad
- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                                  anchor:(nullable UIBarButtonItem *)anchor
                              completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion;

// Returns with activityError as well
- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                                  anchor:(nullable UIBarButtonItem *)anchor
                     completionWithError:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed, NSError*_Nullable error))completion;


/// @name List items on Spotlight


- (void)listOnSpotlight;
- (void)listOnSpotlightWithCallback:(void (^_Nullable)(NSString * _Nullable url, NSError * _Nullable error))callback;

- (void)listOnSpotlightWithIdentifierCallback:(void (^_Nullable)(NSString * _Nullable url,
                                                                 NSString * _Nullable spotlightIdentifier,
                                                                 NSError * _Nullable error))spotlightCallback
    __attribute__((deprecated((
    "iOS 10 has changed how Spotlight indexing works and we’ve updated the SDK to reflect this. "
    "Please see https://dev.branch.io/features/spotlight-indexing/overview/ for instructions on migration."))));

- (void)listOnSpotlightWithLinkProperties:(BranchLinkProperties*_Nullable)linkproperties
                                 callback:(void (^_Nullable)(NSString * _Nullable url,
                                                            NSError * _Nullable error))completion;

- (void)removeFromSpotlightWithCallback:(void (^_Nullable)(NSError * _Nullable error))completion;

- (NSDictionary*_Nonnull)getDictionaryWithCompleteLinkProperties:(BranchLinkProperties*_Nonnull)linkProperties;
- (NSDictionary*_Nonnull)getParamsForServerRequestWithAddedLinkProperties:(BranchLinkProperties*_Nonnull)linkProperties;

/// Convenience method for initSession methods that return BranchUniversalObject, but can be used safely by anyone.
- (NSMutableDictionary*_Nonnull) dictionary;
+ (BranchUniversalObject*_Nonnull) objectWithDictionary:(NSDictionary*_Null_unspecified)dictionary;

- (NSString*_Nonnull) description;
@end
