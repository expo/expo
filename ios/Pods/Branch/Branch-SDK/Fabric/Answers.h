//
//  Answers.h
//  Crashlytics
//
//  Copyright (c) 2015 Crashlytics, Inc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ANSCompatibility.h"

NS_ASSUME_NONNULL_BEGIN

/**
 *  This class exposes the Answers Events API, allowing you to track key 
 *  user user actions and metrics in your app.
 */
@interface Answers : NSObject

/**
 *  Log a Sign Up event to see users signing up for your app in real-time, understand how
 *  many users are signing up with different methods and their success rate signing up.
 *
 *  @param signUpMethodOrNil     The method by which a user logged in, e.g. Twitter or Digits.
 *  @param signUpSucceededOrNil  The ultimate success or failure of the login
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logSignUpWithMethod:(nullable NSString *)signUpMethodOrNil
                    success:(nullable NSNumber *)signUpSucceededOrNil
           customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log an Log In event to see users logging into your app in real-time, understand how many
 *  users are logging in with different methods and their success rate logging into your app.
 *
 *  @param loginMethodOrNil      The method by which a user logged in, e.g. email, Twitter or Digits.
 *  @param loginSucceededOrNil   The ultimate success or failure of the login
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logLoginWithMethod:(nullable NSString *)loginMethodOrNil
                   success:(nullable NSNumber *)loginSucceededOrNil
          customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Share event to see users sharing from your app in real-time, letting you
 *  understand what content they're sharing from the type or genre down to the specific id.
 *
 *  @param shareMethodOrNil      The method by which a user shared, e.g. email, Twitter, SMS.
 *  @param contentNameOrNil      The human readable name for this piece of content.
 *  @param contentTypeOrNil      The type of content shared.
 *  @param contentIdOrNil        The unique identifier for this piece of content. Useful for finding the top shared item.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logShareWithMethod:(nullable NSString *)shareMethodOrNil
               contentName:(nullable NSString *)contentNameOrNil
               contentType:(nullable NSString *)contentTypeOrNil
                 contentId:(nullable NSString *)contentIdOrNil
          customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log an Invite Event to track how users are inviting other users into
 *  your application.
 *
 *  @param inviteMethodOrNil     The method of invitation, e.g. GameCenter, Twitter, email.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logInviteWithMethod:(nullable NSString *)inviteMethodOrNil
           customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Purchase event to see your revenue in real-time, understand how many users are making purchases, see which
 *  items are most popular, and track plenty of other important purchase-related metrics.
 *
 *  @param itemPriceOrNil         The purchased item's price.
 *  @param currencyOrNil          The ISO4217 currency code. Example: USD
 *  @param purchaseSucceededOrNil Was the purchase succesful or unsuccesful
 *  @param itemNameOrNil          The human-readable form of the item's name. Example:
 *  @param itemTypeOrNil          The type, or genre of the item. Example: Song
 *  @param itemIdOrNil            The machine-readable, unique item identifier Example: SKU
 *  @param customAttributesOrNil  A dictionary of custom attributes to associate with this purchase.
 */
+ (void)logPurchaseWithPrice:(nullable NSDecimalNumber *)itemPriceOrNil
                    currency:(nullable NSString *)currencyOrNil
                     success:(nullable NSNumber *)purchaseSucceededOrNil
                    itemName:(nullable NSString *)itemNameOrNil
                    itemType:(nullable NSString *)itemTypeOrNil
                      itemId:(nullable NSString *)itemIdOrNil
            customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Level Start Event to track where users are in your game.
 *
 *  @param levelNameOrNil        The level name
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this level start event.
 */
+ (void)logLevelStart:(nullable NSString *)levelNameOrNil
     customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Level End event to track how users are completing levels in your game.
 *
 *  @param levelNameOrNil                 The name of the level completed, E.G. "1" or "Training"
 *  @param scoreOrNil                     The score the user completed the level with.
 *  @param levelCompletedSuccesfullyOrNil A boolean representing whether or not the level was completed succesfully.
 *  @param customAttributesOrNil          A dictionary of custom attributes to associate with this event.
 */
+ (void)logLevelEnd:(nullable NSString *)levelNameOrNil
              score:(nullable NSNumber *)scoreOrNil
            success:(nullable NSNumber *)levelCompletedSuccesfullyOrNil
   customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log an Add to Cart event to see users adding items to a shopping cart in real-time, understand how
 *  many users start the purchase flow, see which items are most popular, and track plenty of other important
 *  purchase-related metrics.
 *
 *  @param itemPriceOrNil         The purchased item's price.
 *  @param currencyOrNil          The ISO4217 currency code. Example: USD
 *  @param itemNameOrNil          The human-readable form of the item's name. Example:
 *  @param itemTypeOrNil          The type, or genre of the item. Example: Song
 *  @param itemIdOrNil            The machine-readable, unique item identifier Example: SKU
 *  @param customAttributesOrNil  A dictionary of custom attributes to associate with this event.
 */
+ (void)logAddToCartWithPrice:(nullable NSDecimalNumber *)itemPriceOrNil
                     currency:(nullable NSString *)currencyOrNil
                     itemName:(nullable NSString *)itemNameOrNil
                     itemType:(nullable NSString *)itemTypeOrNil
                       itemId:(nullable NSString *)itemIdOrNil
             customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Start Checkout event to see users moving through the purchase funnel in real-time, understand how many
 *  users are doing this and how much they're spending per checkout, and see how it related to other important
 *  purchase-related metrics.
 *
 *  @param totalPriceOrNil        The total price of the cart.
 *  @param currencyOrNil          The ISO4217 currency code. Example: USD
 *  @param itemCountOrNil         The number of items in the cart.
 *  @param customAttributesOrNil  A dictionary of custom attributes to associate with this event.
 */
+ (void)logStartCheckoutWithPrice:(nullable NSDecimalNumber *)totalPriceOrNil
                         currency:(nullable NSString *)currencyOrNil
                        itemCount:(nullable NSNumber *)itemCountOrNil
                 customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Rating event to see users rating content within your app in real-time and understand what
 *  content is most engaging, from the type or genre down to the specific id.
 *
 *  @param ratingOrNil           The integer rating given by the user.
 *  @param contentNameOrNil      The human readable name for this piece of content.
 *  @param contentTypeOrNil      The type of content shared.
 *  @param contentIdOrNil        The unique identifier for this piece of content. Useful for finding the top shared item.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logRating:(nullable NSNumber *)ratingOrNil
      contentName:(nullable NSString *)contentNameOrNil
      contentType:(nullable NSString *)contentTypeOrNil
        contentId:(nullable NSString *)contentIdOrNil
 customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Content View event to see users viewing content within your app in real-time and
 *  understand what content is most engaging, from the type or genre down to the specific id.
 *
 *  @param contentNameOrNil      The human readable name for this piece of content.
 *  @param contentTypeOrNil      The type of content shared.
 *  @param contentIdOrNil        The unique identifier for this piece of content. Useful for finding the top shared item.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logContentViewWithName:(nullable NSString *)contentNameOrNil
                   contentType:(nullable NSString *)contentTypeOrNil
                     contentId:(nullable NSString *)contentIdOrNil
              customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Search event allows you to see users searching within your app in real-time and understand
 *  exactly what they're searching for.
 *
 *  @param queryOrNil            The user's query.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event.
 */
+ (void)logSearchWithQuery:(nullable NSString *)queryOrNil
          customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

/**
 *  Log a Custom Event to see user actions that are uniquely important for your app in real-time, to see how often
 *  they're performing these actions with breakdowns by different categories you add. Use a human-readable name for
 *  the name of the event, since this is how the event will appear in Answers.
 *
 *  @param eventName             The human-readable name for the event.
 *  @param customAttributesOrNil A dictionary of custom attributes to associate with this event. Attribute keys
 *                               must be <code>NSString</code> and and values must be <code>NSNumber</code> or <code>NSString</code>.
 *  @discussion                  How we treat <code>NSNumbers</code>:
 *                               We will provide information about the distribution of values over time.
 *
 *                               How we treat <code>NSStrings</code>:
 *                               NSStrings are used as categorical data, allowing comparison across different category values.
 *                               Strings are limited to a maximum length of 100 characters, attributes over this length will be
 *                               truncated.
 *
 *                               When tracking the Tweet views to better understand user engagement, sending the tweet's length
 *                               and the type of media present in the tweet allows you to track how tweet length and the type of media influence
 *                               engagement.
 */
+ (void)logCustomEventWithName:(NSString *)eventName
              customAttributes:(nullable ANS_GENERIC_NSDICTIONARY(NSString *, id) *)customAttributesOrNil;

@end

NS_ASSUME_NONNULL_END


/*
 * Below are a number of statically defined methods which allow SDK developers to easily
 * and safely log events to Answers if it is installed in a host application.
 *
 */

// Safely gets the Answers class if it is available at runtime.
// This is useful for SDKs dynamically checking if Answers is available, and
// only performing some actions if so.
static _Nullable Class ANSGetAnswersClass() {
    Class answersClass = NSClassFromString(@"Answers");
    if ([answersClass respondsToSelector:@selector(logCustomEventWithName:customAttributes:)]) {
        return answersClass;
    }
    return nil;
}
// Safely logs an AnswersCustomEvent if Answers is available at runtime.
// This is useful for SDKs dynamically logging events to Answers if it is available.
static void ANSLogCustomEvent(NSString *_Nonnull eventName, NSDictionary *_Nullable customAttributesOrNil) {
    Class answersClass = ANSGetAnswersClass();
    if (!answersClass) {
        return;
    }
    [answersClass logCustomEventWithName:eventName customAttributes:customAttributesOrNil];
}
