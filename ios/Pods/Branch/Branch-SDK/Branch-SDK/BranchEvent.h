//
//  BranchEvent.h
//  Branch-SDK
//
//  Created by Edward Smith on 7/24/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "Branch.h"
#import "BNCCommerceEvent.h"
#import "BranchUniversalObject.h"

///@group Branch Event Logging

typedef NSString*const BranchStandardEvent NS_STRING_ENUM;

///@name Commerce Events

FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventAddToCart;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventAddToWishlist;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventViewCart;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventInitiatePurchase;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventAddPaymentInfo;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventPurchase;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventSpendCredits;

///@name Content Events

FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventSearch;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventViewItem;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventViewItems;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventRate;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventShare;

///@name User Lifecycle Events

FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventCompleteRegistration;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventCompleteTutorial;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventAchieveLevel;
FOUNDATION_EXPORT BranchStandardEvent _Nonnull BranchStandardEventUnlockAchievement;

#pragma mark - BranchEvent

@interface BranchEvent : NSObject

- (instancetype _Nonnull) initWithName:(NSString*_Nonnull)name NS_DESIGNATED_INITIALIZER;

+ (instancetype _Nonnull) standardEvent:(BranchStandardEvent _Nonnull)standardEvent;
+ (instancetype _Nonnull) standardEvent:(BranchStandardEvent _Nonnull)standardEvent
                        withContentItem:(BranchUniversalObject* _Nonnull)contentItem;

+ (instancetype _Nonnull) customEventWithName:(NSString*_Nonnull)name;
+ (instancetype _Nonnull) customEventWithName:(NSString*_Nonnull)name
                                  contentItem:(BranchUniversalObject*_Nonnull)contentItem;

- (instancetype _Nonnull) init __attribute((unavailable));
+ (instancetype _Nonnull) new __attribute((unavailable));

@property (nonatomic, strong) NSString*_Nullable                transactionID;
@property (nonatomic, strong) BNCCurrency _Nullable             currency;
@property (nonatomic, strong) NSDecimalNumber*_Nullable         revenue;
@property (nonatomic, strong) NSDecimalNumber*_Nullable         shipping;
@property (nonatomic, strong) NSDecimalNumber*_Nullable         tax;
@property (nonatomic, strong) NSString*_Nullable                coupon;
@property (nonatomic, strong) NSString*_Nullable                affiliation;
@property (nonatomic, strong) NSString*_Nullable                eventDescription;
@property (nonatomic, strong) NSString*_Nullable                searchQuery;
@property (nonatomic, copy) NSMutableArray<BranchUniversalObject*>*_Nonnull       contentItems;
@property (nonatomic, copy) NSMutableDictionary<NSString*, NSString*> *_Nonnull   customData;

- (void) logEvent;                      //!< Logs the event on the Branch server.
- (NSDictionary*_Nonnull) dictionary;   //!< Returns a dictionary representation of the event.
- (NSString* _Nonnull) description;     //!< Returns a string description of the event.
@end

#pragma mark - BranchEventRequest

@interface BranchEventRequest : BNCServerRequest <NSCoding>

- (instancetype _Nonnull) initWithServerURL:(NSURL*_Nonnull)serverURL
                   eventDictionary:(NSDictionary*_Nullable)eventDictionary
                        completion:(void (^_Nullable)(NSDictionary*_Nullable response, NSError*_Nullable error))completion;

@property (strong) NSDictionary*_Nullable eventDictionary;
@property (strong) NSURL*_Nullable serverURL;
@property (copy)   void (^_Nullable completion)(NSDictionary*_Nullable response, NSError*_Nullable error);
@end
