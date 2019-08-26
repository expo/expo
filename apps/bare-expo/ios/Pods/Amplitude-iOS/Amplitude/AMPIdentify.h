//
//  AMPIdentify.h
//  Amplitude
//
//  Created by Daniel Jih on 10/5/15.
//  Copyright © 2015 Amplitude. All rights reserved.
//

/**
 `AMPIdentify` objects are a wrapper for user property operations, which get passed to the `identify` method to send to Amplitude servers.

 **Note:** if a user property is used in multiple operations on the same Identify object, only the first operation will be saved, and the rest will be ignored.

 Each method adds a user property operation to the Identify object, and returns the same Identify object, allowing you to chain multiple method calls together.

 Here is an example of how to use `AMPIdentify` to send user property operations:

    AMPIdentify *identify = [[AMPIdentify identify] add:@"karma" value:[NSNumber numberWithInt:1]];
    [[identify set:@"colors" value:@[@"rose", @"gold"]] append:@"ab-tests" value:@"campaign_a"];
    [[Amplitude instance] identify:identify];

 See [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
@interface AMPIdentify : NSObject

@property (nonatomic, strong, readonly) NSMutableDictionary *userPropertyOperations;

/**-----------------------------------------------------------------------------
 * @name Creating an AMPIdentify Object
 * -----------------------------------------------------------------------------
 */

/**
 Creates a nwe [AMPIdentify](#) object.

 @returns a new [AMPIdentify](#) object.
 */
+ (instancetype)identify;

/**-----------------------------------------------------------------------------
 * @name User Property Operations via Identify API
 * -----------------------------------------------------------------------------
 */

/**
 Increment a user property by a given value (can also be negative to decrement).

 If the user property does not have a value set yet, it will be initialized to 0 before being incremented.

 @param property The user property key

 @param value The amount by which to increment the user property.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)add:(NSString*) property value:(NSObject*) value;

/**
 Append a value or values to a user property.

 If the user property does not have a value set yet, it will be initialized to an empty list before the new values are appended. If the user property has an existing value and it is not a list, the existing value will be converted into a list with the new values appended.

 @param property The user property key

 @param value A value or values to append.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)append:(NSString*) property value:(NSObject*) value;

/*
 Internal method for clearing user properties.

 **Note:** $clearAll needs to be sent on its own Identify object. If there are already other operations, then don't add $clearAll. If $clearAll already in an Identify object, don't allow other operations to be added.
 */
- (AMPIdentify*)clearAll;

/**
 Prepend a value or values to a user property. Prepend means inserting the value or values at the front of a list.

 If the user property does not have a value set yet, it will be initialized to an empty list before the new values are prepended. If the user property has an existing value and it is not a list, the existing value will be converted into a list with the new values prepended.

 @param property The user property key

 @param value A value or values to prepend.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)prepend:(NSString*) property value:(NSObject*) value;

/**
 Sets the value of a given user property. If the value already exists, it will be overwritten with the new value.

 @param property The user property key

 @param value A value or values to set.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)set:(NSString*) property value:(NSObject*) value;


/**
 Sets the value of a given user property only once. Subsequent `setOnce` operations on that user property will be ignored; however, that user property can still be modified through any of the other operations.

 This is useful for capturing properties such as initial_signup_date, initial_referrer, etc.

 @param property The user property key

 @param value A value or values to set once.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)setOnce:(NSString*) property value:(NSObject*) value;


/**
 Unset and remove user property. This user property will no longer show up in that user's profile.

 @param property The user property key to unset.

 @returns the same [AMPIdentify](#) object, allowing you to chain multiple method calls together.

 @see [User Properties and User Property Operations](https://github.com/amplitude/amplitude-ios#user-properties-and-user-property-operations)
 */
- (AMPIdentify*)unset:(NSString*) property;

@end
