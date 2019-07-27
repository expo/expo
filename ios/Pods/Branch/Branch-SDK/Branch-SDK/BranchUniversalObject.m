//
//  BranchUniversalObject.m
//  Branch-SDK
//
//  Created by Derrick Staten on 10/16/15.
//  Copyright © 2015 Branch Metrics. All rights reserved.
//

#import "BranchUniversalObject.h"
#import "BNCError.h"
#import "BranchConstants.h"
#import "BNCFabricAnswers.h"
#import "BNCDeviceInfo.h"
#import "BNCLog.h"
#import "BNCLocalization.h"
#import "BNCEncodingUtils.h"
#import "Branch.h"

#pragma mark BranchContentSchema

BranchContentSchema _Nonnull BranchContentSchemaCommerceAuction     = @"COMMERCE_AUCTION";
BranchContentSchema _Nonnull BranchContentSchemaCommerceBusiness    = @"COMMERCE_BUSINESS";
BranchContentSchema _Nonnull BranchContentSchemaCommerceOther       = @"COMMERCE_OTHER";
BranchContentSchema _Nonnull BranchContentSchemaCommerceProduct     = @"COMMERCE_PRODUCT";
BranchContentSchema _Nonnull BranchContentSchemaCommerceRestaurant  = @"COMMERCE_RESTAURANT";
BranchContentSchema _Nonnull BranchContentSchemaCommerceService     = @"COMMERCE_SERVICE";
BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelFlight= @"COMMERCE_TRAVEL_FLIGHT";
BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelHotel = @"COMMERCE_TRAVEL_HOTEL";
BranchContentSchema _Nonnull BranchContentSchemaCommerceTravelOther = @"COMMERCE_TRAVEL_OTHER";
BranchContentSchema _Nonnull BranchContentSchemaGameState           = @"GAME_STATE";
BranchContentSchema _Nonnull BranchContentSchemaMediaImage          = @"MEDIA_IMAGE";
BranchContentSchema _Nonnull BranchContentSchemaMediaMixed          = @"MEDIA_MIXED";
BranchContentSchema _Nonnull BranchContentSchemaMediaMusic          = @"MEDIA_MUSIC";
BranchContentSchema _Nonnull BranchContentSchemaMediaOther          = @"MEDIA_OTHER";
BranchContentSchema _Nonnull BranchContentSchemaMediaVideo          = @"MEDIA_VIDEO";
BranchContentSchema _Nonnull BranchContentSchemaOther               = @"OTHER";
BranchContentSchema _Nonnull BranchContentSchemaTextArticle         = @"TEXT_ARTICLE";
BranchContentSchema _Nonnull BranchContentSchemaTextBlog            = @"TEXT_BLOG";
BranchContentSchema _Nonnull BranchContentSchemaTextOther           = @"TEXT_OTHER";
BranchContentSchema _Nonnull BranchContentSchemaTextRecipe          = @"TEXT_RECIPE";
BranchContentSchema _Nonnull BranchContentSchemaTextReview          = @"TEXT_REVIEW";
BranchContentSchema _Nonnull BranchContentSchemaTextSearchResults   = @"TEXT_SEARCH_RESULTS";
BranchContentSchema _Nonnull BranchContentSchemaTextStory           = @"TEXT_STORY";
BranchContentSchema _Nonnull BranchContentSchemaTextTechnicalDoc    = @"TEXT_TECHNICAL_DOC";

#pragma mark - BranchCondition

BranchCondition _Nonnull BranchConditionOther         = @"OTHER";
BranchCondition _Nonnull BranchConditionExcellent     = @"EXCELLENT";
BranchCondition _Nonnull BranchConditionNew           = @"NEW";
BranchCondition _Nonnull BranchConditionGood          = @"GOOD";
BranchCondition _Nonnull BranchConditionFair          = @"FAIR";
BranchCondition _Nonnull BranchConditionPoor          = @"POOR";
BranchCondition _Nonnull BranchConditionUsed          = @"USED";
BranchCondition _Nonnull BranchConditionRefurbished   = @"REFURBISHED";

#pragma mark - BranchContentMetadata

@interface BranchContentMetadata () {
    NSMutableArray      *_imageCaptions;
    NSMutableDictionary *_customMetadata;
}
@end

@implementation BranchContentMetadata

- (NSDictionary*_Nonnull) dictionary {
    NSMutableDictionary*dictionary = [NSMutableDictionary new];

    for (NSString *key in self.customMetadata.keyEnumerator) {
        NSString *value = self.customMetadata[key];
        dictionary[key] = value;
    }

    #define BNCFieldDefinesDictionaryFromSelf
    #include "BNCFieldDefines.h"

    addString(contentSchema,    $content_schema);
    addDouble(quantity,         $quantity);
    addDecimal(price,           $price);
    addString(currency,         $currency);
    addString(sku,              $sku);
    addString(productName,      $product_name);
    addString(productBrand,     $product_brand);
    addString(productCategory,  $product_category);
    addString(productVariant,   $product_variant);
    addString(condition,        $condition);
    addDouble(ratingAverage,    $rating_average);
    addInteger(ratingCount,     $rating_count);
    addDouble(ratingMax,        $rating_max);
    addDouble(rating,           $rating);
    addString(addressStreet,    $address_street);
    addString(addressCity,      $address_city);
    addString(addressRegion,    $address_region);
    addString(addressCountry,   $address_country);
    addString(addressPostalCode,$address_postal_code);
    addDouble(latitude,         $latitude);
    addDouble(longitude,        $longitude);
    addStringArray(imageCaptions,$image_captions);

    #include "BNCFieldDefines.h"

    return dictionary;
}

+ (BranchContentMetadata*_Nonnull) contentMetadataWithDictionary:(NSDictionary*_Nullable)dictionary {
    BranchContentMetadata*object = [BranchContentMetadata new];
    if (!dictionary) return object;

    #define BNCFieldDefinesObjectFromDictionary
    #include "BNCFieldDefines.h"

    addString(contentSchema,    $content_schema);
    addDouble(quantity,         $quantity);
    addDecimal(price,           $price);
    addString(currency,         $currency);
    addString(sku,              $sku);
    addString(productName,      $product_name);
    addString(productBrand,     $product_brand);
    addString(productCategory,  $product_category);
    addString(productVariant,   $product_variant);
    addString(condition,        $condition);
    addDouble(ratingAverage,    $rating_average);
    addInteger(ratingCount,     $rating_count);
    addDouble(ratingMax,        $rating_max);
    addDouble(rating,           $rating);
    addString(addressStreet,    $address_street);
    addString(addressCity,      $address_city);
    addString(addressRegion,    $address_region);
    addString(addressCountry,   $address_country);
    addString(addressPostalCode,$address_postal_code);
    addDouble(latitude,         $latitude);
    addDouble(longitude,        $longitude);
    addStringArray(imageCaptions,$image_captions);

    #include "BNCFieldDefines.h"

    return object;
}

- (NSMutableDictionary*) customMetadata {
    if (!_customMetadata) _customMetadata = [NSMutableDictionary new];
    return _customMetadata;
}

- (void) setCustomMetadata:(NSMutableDictionary*)dictionary {
    _customMetadata = [dictionary mutableCopy];
}

- (void) setImageCaptions:(NSMutableArray<NSString *> *)imageCaptions {
    _imageCaptions = [imageCaptions mutableCopy];
}

- (NSMutableArray<NSString *> *) imageCaptions {
    if (!_imageCaptions) _imageCaptions = [NSMutableArray new];
    return _imageCaptions;
}

- (NSString*) description {
    return [NSString stringWithFormat:@"<%@ 0x%016llx schema: %@ userData: %ld items>",
        NSStringFromClass(self.class),
        (uint64_t) self,
        _contentSchema,
        (long) _customMetadata.count
    ];
}

@end

#pragma mark - BranchUniversalObject

@implementation BranchUniversalObject

- (instancetype)initWithCanonicalIdentifier:(NSString *)canonicalIdentifier {
    if ((self = [super init])) {
        self.canonicalIdentifier = canonicalIdentifier;
    }
    return self;
}

- (instancetype)initWithTitle:(NSString *)title {
    if ((self = [super init])) {
        self.title = title;
    }
    return self;
}

#pragma mark - Deprecated Fields

- (NSDictionary *)metadata {
    return self.contentMetadata.customMetadata;
}

- (void) setMetadata:(NSDictionary *)metadata {
    self.contentMetadata.customMetadata = (NSMutableDictionary*) metadata;
}

- (void)addMetadataKey:(NSString *)key value:(NSString *)value {
    if (key) [self.contentMetadata.customMetadata setValue:value forKey:key];
}

- (CGFloat) price {
    return [self.contentMetadata.price floatValue];
}

- (void) setPrice:(CGFloat)price {
    NSString *string = [NSString stringWithFormat:@"%f", price];
    self.contentMetadata.price = [NSDecimalNumber decimalNumberWithString:string];
}

- (NSString*) currency {
    return self.contentMetadata.currency;
}

- (void) setCurrency:(NSString *)currency {
    self.contentMetadata.currency = currency;
}

- (NSString*) type {
    return self.contentMetadata.contentSchema;
}

- (void) setType:(NSString*)type {
    self.contentMetadata.contentSchema = type;
}

- (BranchContentIndexMode) contentIndexMode {
    if (self.publiclyIndex)
        return BranchContentIndexModePublic;
    else
        return BranchContentIndexModePrivate;
}

- (void) setContentIndexMode:(BranchContentIndexMode)contentIndexMode {
    if (contentIndexMode == BranchContentIndexModePublic)
        self.publiclyIndex = YES;
    else
        self.locallyIndex = YES;
}

- (BOOL) automaticallyListOnSpotlight {
    return self.locallyIndex;
}

- (void) setAutomaticallyListOnSpotlight:(BOOL)automaticallyListOnSpotlight {
    self.locallyIndex = automaticallyListOnSpotlight;
}

#pragma mark - Setters / Getters / Standard Methods

- (BranchContentMetadata*) contentMetadata {
    if (!_contentMetadata) _contentMetadata = [BranchContentMetadata new];
    return _contentMetadata;
}

- (NSString *)description {
    return [NSString stringWithFormat:
        @"<%@ 0x%016llx"
         "\n canonicalIdentifier: %@"
         "\n title: %@"
         "\n contentDescription: %@"
         "\n imageUrl: %@"
         "\n metadata: %@"
         "\n type: %@"
         "\n locallyIndex: %d"
         "\n publiclyIndex: %d"
         "\n keywords: %@"
         "\n expirationDate: %@"
         "\n>",
         NSStringFromClass(self.class), (uint64_t) self,
        self.canonicalIdentifier,
        self.title,
        self.contentDescription,
        self.imageUrl,
        self.contentMetadata.customMetadata,
        self.contentMetadata.contentSchema,
        self.locallyIndex,
        self.publiclyIndex,
        self.keywords,
        self.expirationDate];
}

#pragma mark - User Event Logging

- (void)registerView {
    [self registerViewWithCallback:nil];
}

- (void)registerViewWithCallback:(callbackWithParams)callback {
    if (!self.canonicalIdentifier && !self.title) {
        NSString *message = BNCLocalizedString(@"Could not register view.");
        NSError *error = [NSError branchErrorWithCode:BNCContentIdentifierError localizedMessage:message];
        BNCLogWarning(@"%@", error);
        if (callback) callback([[NSDictionary alloc] init], error);
        return;
    }
    if (self.locallyIndex) {
        [self listOnSpotlight];
    }
    [[BranchEvent standardEvent:BranchStandardEventViewItem withContentItem:self] logEvent];
    if (callback) callback(@{}, nil);
}

- (void)userCompletedAction:(NSString *)action {
    [self userCompletedAction:action withState:nil];
}

- (void)userCompletedAction:(NSString *)action withState:(NSDictionary *)state {
    if (state) [self.contentMetadata.customMetadata addEntriesFromDictionary:state];
    [[BranchEvent customEventWithName:action contentItem:self] logEvent];

    // Maybe list on spotlight --
    NSDictionary *linkParams = self.dictionary;
    if (self.locallyIndex && self.canonicalIdentifier && linkParams) {

        NSMutableDictionary *actionPayload = [[NSMutableDictionary alloc] init];
        actionPayload[BNCCanonicalIdList] = @[self.canonicalIdentifier];
        actionPayload[self.canonicalIdentifier] = linkParams;
        if (state) [actionPayload addEntriesFromDictionary:state];

        if ([action isEqualToString:BNCRegisterViewEvent])
            [self listOnSpotlight];
    }
}

#pragma mark - Link Creation Methods

- (NSString *)getShortUrlWithLinkProperties:(BranchLinkProperties *)linkProperties {
    if (!self.canonicalIdentifier && !self.title) {
        BNCLogWarning(@"A canonicalIdentifier or title are required to uniquely identify content, so could not generate a URL.");
        return nil;
    }
    
    return [[Branch getInstance] getShortUrlWithParams:[self getParamsForServerRequestWithAddedLinkProperties:linkProperties]
                                               andTags:linkProperties.tags
                                              andAlias:linkProperties.alias
                                            andChannel:linkProperties.channel
                                            andFeature:linkProperties.feature
                                              andStage:linkProperties.stage
                                           andCampaign:linkProperties.campaign
                                      andMatchDuration:linkProperties.matchDuration];
}

- (void)getShortUrlWithLinkProperties:(BranchLinkProperties *)linkProperties andCallback:(callbackWithUrl)callback {
    if (!self.canonicalIdentifier && !self.title) {
        NSString *message = BNCLocalizedString(@"Could not generate a URL.");
        NSError *error = [NSError branchErrorWithCode:BNCContentIdentifierError localizedMessage:message];
        BNCLogWarning(@"%@", error);
        if (callback) callback([BNCPreferenceHelper preferenceHelper].userUrl, error);
        return;
    }
    
    [[Branch getInstance] getShortUrlWithParams:[self getParamsForServerRequestWithAddedLinkProperties:linkProperties]
                                        andTags:linkProperties.tags
                                       andAlias:linkProperties.alias
                               andMatchDuration:linkProperties.matchDuration
                                     andChannel:linkProperties.channel
                                     andFeature:linkProperties.feature
                                       andStage:linkProperties.stage
                                    andCampaign:linkProperties.campaign
                                    andCallback:callback];
}

- (NSString *)getShortUrlWithLinkPropertiesAndIgnoreFirstClick:(BranchLinkProperties *)linkProperties {
    if (!self.canonicalIdentifier && !self.title) {
        NSString *message = BNCLocalizedString(@"Could not generate a URL.");
        NSError *error = [NSError branchErrorWithCode:BNCContentIdentifierError localizedMessage:message];
        BNCLogWarning(@"%@", error);
        return nil;
    }
    // keep this operation outside of sync operation below.
    NSString *UAString = [BNCDeviceInfo userAgentString];

    return [[Branch getInstance] getShortURLWithParams:[self getParamsForServerRequestWithAddedLinkProperties:linkProperties]
                                        andTags:linkProperties.tags
                                     andChannel:linkProperties.channel
                                     andFeature:linkProperties.feature
                                       andStage:linkProperties.stage
                                    andCampaign:linkProperties.campaign
                                       andAlias:linkProperties.alias
                                 ignoreUAString:UAString
                              forceLinkCreation:YES];
}

- (NSString *)getLongUrlWithChannel:(NSString *)channel
                            andTags:(NSArray *)tags
                         andFeature:(NSString *)feature
                           andStage:(NSString *)stage
                           andAlias:(NSString *)alias {
    NSString *urlString =
        [[Branch getInstance]
            getLongURLWithParams:self.dictionary
            andChannel:channel
            andTags:tags
            andFeature:feature
            andStage:stage
            andAlias:alias];
    return urlString;
}

#pragma mark - Share Sheets

- (UIActivityItemProvider *)getBranchActivityItemWithLinkProperties:(BranchLinkProperties *)linkProperties {
    if (!self.canonicalIdentifier && !self.canonicalUrl && !self.title) {
        BNCLogWarning(@"A canonicalIdentifier, canonicalURL, or title are required to uniquely identify content. "
            "In order to not break the end user experience with sharing, Branch SDK will proceed to create a URL, "
            "but content analytics may not properly include this URL.");
    }
    
    NSMutableDictionary *params = [[self getParamsForServerRequestWithAddedLinkProperties:linkProperties] mutableCopy];
    if (linkProperties.matchDuration) {
        [params setObject:@(linkProperties.matchDuration) forKey:BRANCH_REQUEST_KEY_URL_DURATION];
    }

    return [Branch getBranchActivityItemWithParams:params
                                           feature:linkProperties.feature
                                             stage:linkProperties.stage
                                          campaign:linkProperties.campaign
                                              tags:linkProperties.tags
                                             alias:linkProperties.alias];
}

- (void)showShareSheetWithShareText:(NSString *)shareText
                         completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion {
    [self showShareSheetWithLinkProperties:nil andShareText:shareText fromViewController:nil completion:completion];
}

- (void)showShareSheetWithLinkProperties:(BranchLinkProperties *)linkProperties
                            andShareText:(NSString *)shareText
                      fromViewController:(UIViewController *)viewController
                              completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion {
    [self showShareSheetWithLinkProperties:linkProperties andShareText:shareText
        fromViewController:viewController anchor:nil completion:completion orCompletionWithError:nil];
}

- (void)showShareSheetWithLinkProperties:(BranchLinkProperties *)linkProperties
                            andShareText:(NSString *)shareText
                      fromViewController:(UIViewController *)viewController
                     completionWithError:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed, NSError*_Nullable error))completion {
    [self showShareSheetWithLinkProperties:linkProperties andShareText:shareText
        fromViewController:viewController anchor:nil completion:nil orCompletionWithError:completion];
}

- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                                  anchor:(nullable id)anchor
                              completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion {
    [self showShareSheetWithLinkProperties:linkProperties andShareText:shareText
        fromViewController:viewController anchor:anchor completion:completion orCompletionWithError:nil];
}

- (void)showShareSheetWithLinkProperties:(nullable BranchLinkProperties *)linkProperties
                            andShareText:(nullable NSString *)shareText
                      fromViewController:(nullable UIViewController *)viewController
                                  anchor:(nullable id)anchor
                     completionWithError:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed, NSError*_Nullable error))completion {
    [self showShareSheetWithLinkProperties:linkProperties andShareText:shareText
        fromViewController:viewController anchor:anchor completion:nil orCompletionWithError:completion];
}

- (void)showShareSheetWithLinkProperties:(BranchLinkProperties *)linkProperties
                            andShareText:(NSString *)shareText
                      fromViewController:(UIViewController *)viewController
                                  anchor:(nullable id)anchorViewOrButtonItem
                              completion:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed))completion
                   orCompletionWithError:(void (^ _Nullable)(NSString * _Nullable activityType, BOOL completed, NSError*_Nullable error))completionError {

    // Log share initiated event
    [[BranchEvent customEventWithName:BNCShareInitiatedEvent contentItem:self] logEvent];
    UIActivityItemProvider *itemProvider = [self getBranchActivityItemWithLinkProperties:linkProperties];
    NSMutableArray *items = [NSMutableArray arrayWithObject:itemProvider];
    if (shareText) {
        [items insertObject:shareText atIndex:0];
    }
    UIActivityViewController *shareViewController =
        [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
    
    if ([shareViewController respondsToSelector:@selector(completionWithItemsHandler)]) {
        shareViewController.completionWithItemsHandler =
          ^(NSString *activityType, BOOL completed, NSArray *returnedItems, NSError *activityError) {
            // Log share completed event
            if (completed && !activityError) {
                [[BranchEvent customEventWithName:BNCShareCompletedEvent contentItem:self] logEvent];
                [BNCFabricAnswers sendEventWithName:@"Branch Share" andAttributes:[self getDictionaryWithCompleteLinkProperties:linkProperties]];
            }
            if (completion)
                completion(activityType, completed);
            else
            if (completionError)
                completionError(activityType, completed, activityError);
        };
    } else {
        #pragma clang diagnostic push
        #pragma clang diagnostic ignored "-Wdeprecated-declarations"
        // Deprecated in iOS 8.  Safe to hide deprecation warnings as the new completion handler is checked for above
        shareViewController.completionHandler = completion;
        #pragma clang diagnostic pop
    }
    
    UIViewController *presentingViewController = nil;
    if (viewController && [viewController respondsToSelector:@selector(presentViewController:animated:completion:)]) {
        presentingViewController = viewController;
    }
    else {
        UIViewController *rootViewController = [UIViewController bnc_currentViewController];
        if ([rootViewController respondsToSelector:@selector(presentViewController:animated:completion:)]) {
            presentingViewController = rootViewController;
        }
    }
    
    if (linkProperties.controlParams[BRANCH_LINK_DATA_KEY_EMAIL_SUBJECT]) {
        @try {
            [shareViewController setValue:linkProperties.controlParams[BRANCH_LINK_DATA_KEY_EMAIL_SUBJECT] forKey:@"subject"];
        }
        @catch (NSException*) {
            BNCLogWarning(@"Unable to setValue 'emailSubject' forKey 'subject' on UIActivityViewController.");
        }
    }
    
    if (presentingViewController) {
        // Required for iPad/Universal apps on iOS 8+
        if ([presentingViewController respondsToSelector:@selector(popoverPresentationController)]) {
            if ([anchorViewOrButtonItem isKindOfClass:UIBarButtonItem.class]) {
                UIBarButtonItem *anchor = (UIBarButtonItem*) anchorViewOrButtonItem;
                shareViewController.popoverPresentationController.barButtonItem = anchor;
            } else
            if ([anchorViewOrButtonItem isKindOfClass:UIView.class]) {
                UIView *anchor = (UIView*) anchorViewOrButtonItem;
                shareViewController.popoverPresentationController.sourceView = anchor;
                shareViewController.popoverPresentationController.sourceRect = anchor.bounds;
            } else {
                shareViewController.popoverPresentationController.sourceView = presentingViewController.view;
                shareViewController.popoverPresentationController.sourceRect = CGRectMake(0.0, 0.0, 40.0, 40.0);
            }
        }
        [presentingViewController presentViewController:shareViewController animated:YES completion:nil];
    }
    else {
        BNCLogWarning(@"Unable to show the share sheet since no view controller is present.");
    }
}

#pragma mark - Spotlight

- (void)listOnSpotlight {
    [self listOnSpotlightWithCallback:nil];
}

- (void)listOnSpotlightWithCallback:(callbackWithUrl)callback {
    [[Branch getInstance]
        indexOnSpotlightWithBranchUniversalObject:self
        linkProperties:nil
        completion:^(BranchUniversalObject *universalObject, NSString *url, NSError *error) {
            if (callback) callback(url,error);
        }];
}

//This one uses a callback that returns the SpotlightIdentifier
- (void)listOnSpotlightWithIdentifierCallback:(callbackWithUrlAndSpotlightIdentifier)spotlightCallback {
    BOOL publiclyIndexable;
    if (self.contentIndexMode == BranchContentIndexModePrivate) {
        publiclyIndexable = NO;
    }
    else {
        publiclyIndexable = YES;
    }
    
    NSMutableDictionary *metadataAndProperties = [self.metadata mutableCopy];
    if (self.canonicalIdentifier) {
        metadataAndProperties[BRANCH_LINK_DATA_KEY_CANONICAL_IDENTIFIER] = self.canonicalIdentifier;
    }
    if (self.canonicalUrl) {
        metadataAndProperties[BRANCH_LINK_DATA_KEY_CANONICAL_URL] = self.canonicalUrl;
    }
    
    [[Branch getInstance] createDiscoverableContentWithTitle:self.title
                                                 description:self.contentDescription
                                                thumbnailUrl:[NSURL URLWithString:self.imageUrl]
                                                 canonicalId:self.canonicalIdentifier
                                                  linkParams:metadataAndProperties.copy
                                                        type:self.type
                                           publiclyIndexable:publiclyIndexable
                                                    keywords:[NSSet setWithArray:self.keywords]
                                              expirationDate:self.expirationDate
                                           spotlightCallback:spotlightCallback];
}

- (void)listOnSpotlightWithLinkProperties:(BranchLinkProperties*_Nullable)linkproperties
                                callback:(void (^_Nullable)(NSString * _Nullable url,
                                                            NSError * _Nullable error))completion {
    [[Branch getInstance]
        indexOnSpotlightWithBranchUniversalObject:self
        linkProperties:linkproperties
        completion:^(BranchUniversalObject *universalObject, NSString *url, NSError *error) {
            if (completion) completion(url,error);
        }];
}

- (void) removeFromSpotlightWithCallback:(void (^_Nullable)(NSError * _Nullable error))completion{
    if (self.locallyIndex) {
        [[Branch getInstance] removeSearchableItemWithBranchUniversalObject:self
                                                                   callback:^(NSError *error) {
                                                                       if (completion) {
                                                                           completion(error);
                                                                       }
                                                                   }];
    } else {
        NSError *error = [NSError branchErrorWithCode:BNCSpotlightPublicIndexError
                                     localizedMessage:@"Publically indexed cannot be removed from Spotlight"];
        completion(error);
    }
}

#pragma mark - Dictionary Methods

- (NSDictionary *)getParamsForServerRequestWithAddedLinkProperties:(BranchLinkProperties *)linkProperties {
    // TODO: Add warnings if controlParams contains non-control params
    NSMutableDictionary *temp = self.dictionary;
    [temp addEntriesFromDictionary:[linkProperties.controlParams copy]];
    return temp;
}

- (NSDictionary *)getDictionaryWithCompleteLinkProperties:(BranchLinkProperties *)linkProperties {
    NSMutableDictionary *temp = [[self getParamsForServerRequestWithAddedLinkProperties:linkProperties] mutableCopy];
    
    [self safeSetValue:linkProperties.tags forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_TAGS] onDict:temp];
    [self safeSetValue:linkProperties.feature forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_FEATURE] onDict:temp];
    [self safeSetValue:linkProperties.alias forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_ALIAS] onDict:temp];
    [self safeSetValue:linkProperties.channel forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CHANNEL] onDict:temp];
    [self safeSetValue:linkProperties.stage forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_STAGE] onDict:temp];
    [self safeSetValue:linkProperties.campaign forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_CAMPAIGN] onDict:temp];
    [self safeSetValue:@(linkProperties.matchDuration) forKey:[NSString stringWithFormat:@"~%@", BRANCH_REQUEST_KEY_URL_DURATION] onDict:temp];

    return [temp copy];
}
- (void)safeSetValue:(NSObject *)value forKey:(NSString *)key onDict:(NSMutableDictionary *)dict {
    if (value) {
        dict[key] = value;
    }
}

+ (BranchUniversalObject*_Nonnull) objectWithDictionary:(NSDictionary*_Null_unspecified)dictionary {
    BranchUniversalObject *object = [BranchUniversalObject new];

    #define BNCFieldDefinesObjectFromDictionary
    #include "BNCFieldDefines.h"

    addString(canonicalIdentifier,          $canonical_identifier);
    addString(canonicalUrl,                 $canonical_url);
    addDate(creationDate,                   $creation_timestamp);
    addDate(expirationDate,                 $exp_date);
    addStringArray(keywords,                $keywords);
    addBoolean(locallyIndex,                $locally_indexable);
    addString(contentDescription,           $og_description);
    addString(imageUrl,                     $og_image_url);
    addString(title,                        $og_title);
    addBoolean(publiclyIndex,               $publicly_indexable);

    #include "BNCFieldDefines.h"

    BranchContentMetadata *data = [BranchContentMetadata contentMetadataWithDictionary:dictionary];
    object.contentMetadata = data;

    NSSet *fieldsAdded = [NSSet setWithArray:@[
        @"$canonical_identifier",
        @"$canonical_url",
        @"$creation_timestamp",
        @"$exp_date",
        @"$keywords",
        @"$locally_indexable",
        @"$og_description",
        @"$og_image_url",
        @"$og_title",
        @"$publicly_indexable",
        @"$content_schema",
        @"$quantity",
        @"$price",
        @"$currency",
        @"$sku",
        @"$product_name",
        @"$product_brand",
        @"$product_category",
        @"$product_variant",
        @"$condition",
        @"$rating_average",
        @"$rating_count",
        @"$rating_max",
        @"$rating",
        @"$address_street",
        @"$address_city",
        @"$address_region",
        @"$address_country",
        @"$address_postal_code",
        @"$latitude",
        @"$longitude",
        @"$image_captions",
        @"$custom_fields",
    ]];

    // Add any extra fields to the content object.contentMetadata.customMetadata

    for (NSString* key in dictionary.keyEnumerator) {
        if (![fieldsAdded containsObject:key]) {
            object.contentMetadata.customMetadata[key] = dictionary[key];
        }
    }

    return object;
}

- (NSDictionary*_Nonnull) dictionary {

    NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];

    NSDictionary *contentDictionary = [self.contentMetadata dictionary];
    if (contentDictionary.count) [dictionary addEntriesFromDictionary:contentDictionary];

    #define BNCFieldDefinesDictionaryFromSelf
    #include "BNCFieldDefines.h"

    addString(canonicalIdentifier,          $canonical_identifier);
    addString(canonicalUrl,                 $canonical_url);
    addDate(creationDate,                   $creation_timestamp);
    addDate(expirationDate,                 $exp_date);
    addStringArray(keywords,                $keywords);
    addBoolean(locallyIndex,                $locally_indexable);
    addString(contentDescription,           $og_description);
    addString(imageUrl,                     $og_image_url);
    addString(title,                        $og_title);
    addBoolean(publiclyIndex,               $publicly_indexable);

    #include "BNCFieldDefines.h"

    return dictionary;
}

@end
