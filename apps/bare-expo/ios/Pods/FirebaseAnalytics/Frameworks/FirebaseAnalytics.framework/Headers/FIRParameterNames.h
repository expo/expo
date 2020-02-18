/// @file FIRParameterNames.h
///
/// Predefined event parameter names.
///
/// Params supply information that contextualize Events. You can associate up to 25 unique Params
/// with each Event type. Some Params are suggested below for certain common Events, but you are
/// not limited to these. You may supply extra Params for suggested Events or custom Params for
/// Custom events. Param names can be up to 40 characters long, may only contain alphanumeric
/// characters and underscores ("_"), and must start with an alphabetic character. Param values can
/// be up to 100 characters long. The "firebase_", "google_", and "ga_" prefixes are reserved and
/// should not be used.

#import <Foundation/Foundation.h>

/// Game achievement ID (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterAchievementID : @"10_matches_won",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterAchievementID NS_SWIFT_NAME(AnalyticsParameterAchievementID) =
    @"achievement_id";

/// Ad Network Click ID (NSString). Used for network-specific click IDs which vary in format.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterAdNetworkClickID : @"1234567",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterAdNetworkClickID
    NS_SWIFT_NAME(AnalyticsParameterAdNetworkClickID) = @"aclid";

/// The store or affiliation from which this transaction occurred (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterAffiliation : @"Google Store",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterAffiliation NS_SWIFT_NAME(AnalyticsParameterAffiliation) =
    @"affiliation";

/// The individual campaign name, slogan, promo code, etc. Some networks have pre-defined macro to
/// capture campaign information, otherwise can be populated by developer. Highly Recommended
/// (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCampaign : @"winter_promotion",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCampaign NS_SWIFT_NAME(AnalyticsParameterCampaign) =
    @"campaign";

/// Character used in game (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCharacter : @"beat_boss",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCharacter NS_SWIFT_NAME(AnalyticsParameterCharacter) =
    @"character";

/// The checkout step (1..N) (unsigned 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCheckoutStep : @"1",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCheckoutStep NS_SWIFT_NAME(AnalyticsParameterCheckoutStep) =
    @"checkout_step";

/// Some option on a step in an ecommerce flow (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCheckoutOption : @"Visa",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCheckoutOption
    NS_SWIFT_NAME(AnalyticsParameterCheckoutOption) = @"checkout_option";

/// Campaign content (NSString).
static NSString *const kFIRParameterContent NS_SWIFT_NAME(AnalyticsParameterContent) = @"content";

/// Type of content selected (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterContentType : @"news article",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterContentType NS_SWIFT_NAME(AnalyticsParameterContentType) =
    @"content_type";

/// Coupon code for a purchasable item (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCoupon : @"zz123",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCoupon NS_SWIFT_NAME(AnalyticsParameterCoupon) = @"coupon";

/// Campaign custom parameter (NSString). Used as a method of capturing custom data in a campaign.
/// Use varies by network.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCP1 : @"custom_data",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCP1 NS_SWIFT_NAME(AnalyticsParameterCP1) = @"cp1";

/// The name of a creative used in a promotional spot (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCreativeName : @"Summer Sale",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCreativeName NS_SWIFT_NAME(AnalyticsParameterCreativeName) =
    @"creative_name";

/// The name of a creative slot (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCreativeSlot : @"summer_banner2",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCreativeSlot NS_SWIFT_NAME(AnalyticsParameterCreativeSlot) =
    @"creative_slot";

/// Purchase currency in 3-letter <a href="http://en.wikipedia.org/wiki/ISO_4217#Active_codes">
/// ISO_4217</a> format (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterCurrency : @"USD",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterCurrency NS_SWIFT_NAME(AnalyticsParameterCurrency) =
    @"currency";

/// Flight or Travel destination (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterDestination : @"Mountain View, CA",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterDestination NS_SWIFT_NAME(AnalyticsParameterDestination) =
    @"destination";

/// The arrival date, check-out date or rental end date for the item. This should be in
/// YYYY-MM-DD format (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterEndDate : @"2015-09-14",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterEndDate NS_SWIFT_NAME(AnalyticsParameterEndDate) = @"end_date";

/// Flight number for travel events (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterFlightNumber : @"ZZ800",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterFlightNumber NS_SWIFT_NAME(AnalyticsParameterFlightNumber) =
    @"flight_number";

/// Group/clan/guild ID (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterGroupID : @"g1",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterGroupID NS_SWIFT_NAME(AnalyticsParameterGroupID) = @"group_id";

/// Index of an item in a list (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterIndex : @(1),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterIndex NS_SWIFT_NAME(AnalyticsParameterIndex) = @"index";

/// Item brand (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemBrand : @"Google",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemBrand NS_SWIFT_NAME(AnalyticsParameterItemBrand) =
    @"item_brand";

/// Item category (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemCategory : @"t-shirts",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemCategory NS_SWIFT_NAME(AnalyticsParameterItemCategory) =
    @"item_category";

/// Item ID (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemID : @"p7654",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemID NS_SWIFT_NAME(AnalyticsParameterItemID) = @"item_id";

/// The Google <a href="https://developers.google.com/places/place-id">Place ID</a> (NSString) that
/// corresponds to the associated item. Alternatively, you can supply your own custom Location ID.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemLocationID : @"ChIJiyj437sx3YAR9kUWC8QkLzQ",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemLocationID
    NS_SWIFT_NAME(AnalyticsParameterItemLocationID) = @"item_location_id";

/// Item name (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemName : @"abc",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemName NS_SWIFT_NAME(AnalyticsParameterItemName) =
    @"item_name";

/// The list in which the item was presented to the user (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemList : @"Search Results",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemList NS_SWIFT_NAME(AnalyticsParameterItemList) =
    @"item_list";

/// Item variant (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterItemVariant : @"Red",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterItemVariant NS_SWIFT_NAME(AnalyticsParameterItemVariant) =
    @"item_variant";

/// Level in game (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterLevel : @(42),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterLevel NS_SWIFT_NAME(AnalyticsParameterLevel) = @"level";

/// Location (NSString). The Google <a href="https://developers.google.com/places/place-id">Place ID
/// </a> that corresponds to the associated event. Alternatively, you can supply your own custom
/// Location ID.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterLocation : @"ChIJiyj437sx3YAR9kUWC8QkLzQ",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterLocation NS_SWIFT_NAME(AnalyticsParameterLocation) =
    @"location";

/// The advertising or marketing medium, for example: cpc, banner, email, push. Highly recommended
/// (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterMedium : @"email",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterMedium NS_SWIFT_NAME(AnalyticsParameterMedium) = @"medium";

/// Number of nights staying at hotel (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterNumberOfNights : @(3),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterNumberOfNights
    NS_SWIFT_NAME(AnalyticsParameterNumberOfNights) = @"number_of_nights";

/// Number of passengers traveling (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterNumberOfPassengers : @(11),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterNumberOfPassengers
    NS_SWIFT_NAME(AnalyticsParameterNumberOfPassengers) = @"number_of_passengers";

/// Number of rooms for travel events (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterNumberOfRooms : @(2),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterNumberOfRooms NS_SWIFT_NAME(AnalyticsParameterNumberOfRooms) =
    @"number_of_rooms";

/// Flight or Travel origin (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterOrigin : @"Mountain View, CA",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterOrigin NS_SWIFT_NAME(AnalyticsParameterOrigin) = @"origin";

/// Purchase price (double as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterPrice : @(1.0),
///       kFIRParameterCurrency : @"USD",  // e.g. $1.00 USD
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterPrice NS_SWIFT_NAME(AnalyticsParameterPrice) = @"price";

/// Purchase quantity (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterQuantity : @(1),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterQuantity NS_SWIFT_NAME(AnalyticsParameterQuantity) =
    @"quantity";

/// Score in game (signed 64-bit integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterScore : @(4200),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterScore NS_SWIFT_NAME(AnalyticsParameterScore) = @"score";

/// The search string/keywords used (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterSearchTerm : @"periodic table",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterSearchTerm NS_SWIFT_NAME(AnalyticsParameterSearchTerm) =
    @"search_term";

/// Shipping cost (double as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterShipping : @(9.50),
///       kFIRParameterCurrency : @"USD",  // e.g. $9.50 USD
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterShipping NS_SWIFT_NAME(AnalyticsParameterShipping) =
    @"shipping";

/// Sign up method (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterSignUpMethod : @"google",
///       // ...
///     };
/// </pre>
///
/// <b>This constant has been deprecated. Use Method constant instead.</b>
static NSString *const kFIRParameterSignUpMethod NS_SWIFT_NAME(AnalyticsParameterSignUpMethod) =
    @"sign_up_method";

/// A particular approach used in an operation; for example, "facebook" or "email" in the context
/// of a sign_up or login event.  (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterMethod : @"google",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterMethod NS_SWIFT_NAME(AnalyticsParameterMethod) = @"method";

/// The origin of your traffic, such as an Ad network (for example, google) or partner (urban
/// airship). Identify the advertiser, site, publication, etc. that is sending traffic to your
/// property. Highly recommended (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterSource : @"InMobi",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterSource NS_SWIFT_NAME(AnalyticsParameterSource) = @"source";

/// The departure date, check-in date or rental start date for the item. This should be in
/// YYYY-MM-DD format (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterStartDate : @"2015-09-14",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterStartDate NS_SWIFT_NAME(AnalyticsParameterStartDate) =
    @"start_date";

/// Tax amount (double as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterTax : @(1.0),
///       kFIRParameterCurrency : @"USD",  // e.g. $1.00 USD
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterTax NS_SWIFT_NAME(AnalyticsParameterTax) = @"tax";

/// If you're manually tagging keyword campaigns, you should use utm_term to specify the keyword
/// (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterTerm : @"game",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterTerm NS_SWIFT_NAME(AnalyticsParameterTerm) = @"term";

/// A single ID for a ecommerce group transaction (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterTransactionID : @"ab7236dd9823",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterTransactionID NS_SWIFT_NAME(AnalyticsParameterTransactionID) =
    @"transaction_id";

/// Travel class (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterTravelClass : @"business",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterTravelClass NS_SWIFT_NAME(AnalyticsParameterTravelClass) =
    @"travel_class";

/// A context-specific numeric value which is accumulated automatically for each event type. This is
/// a general purpose parameter that is useful for accumulating a key metric that pertains to an
/// event. Examples include revenue, distance, time and points. Value should be specified as signed
/// 64-bit integer or double as NSNumber. Notes: Values for pre-defined currency-related events
/// (such as @c kFIREventAddToCart) should be supplied using double as NSNumber and must be
/// accompanied by a @c kFIRParameterCurrency parameter. The valid range of accumulated values is
/// [-9,223,372,036,854.77, 9,223,372,036,854.77]. Supplying a non-numeric value, omitting the
/// corresponding @c kFIRParameterCurrency parameter, or supplying an invalid
/// <a href="https://goo.gl/qqX3J2">currency code</a> for conversion events will cause that
/// conversion to be omitted from reporting.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterValue : @(3.99),
///       kFIRParameterCurrency : @"USD",  // e.g. $3.99 USD
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterValue NS_SWIFT_NAME(AnalyticsParameterValue) = @"value";

/// Name of virtual currency type (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterVirtualCurrencyName : @"virtual_currency_name",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterVirtualCurrencyName
    NS_SWIFT_NAME(AnalyticsParameterVirtualCurrencyName) = @"virtual_currency_name";

/// The name of a level in a game (NSString).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterLevelName : @"room_1",
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterLevelName NS_SWIFT_NAME(AnalyticsParameterLevelName) =
    @"level_name";

/// The result of an operation. Specify 1 to indicate success and 0 to indicate failure (unsigned
/// integer as NSNumber).
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterSuccess : @(1),
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterSuccess NS_SWIFT_NAME(AnalyticsParameterSuccess) = @"success";

/// Indicates that the associated event should either extend the current session
/// or start a new session if no session was active when the event was logged.
/// Specify YES to extend the current session or to start a new session; any
/// other value will not extend or start a session.
/// <pre>
///     NSDictionary *params = @{
///       kFIRParameterExtendSession : @YES,
///       // ...
///     };
/// </pre>
static NSString *const kFIRParameterExtendSession NS_SWIFT_NAME(AnalyticsParameterExtendSession) =
    @"extend_session";
