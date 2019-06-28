/**
 @file          BNCKeyChain.h
 @package       Branch-SDK
 @brief         Simple access routines for secure keychain storage.

 @author        Edward Smith
 @date          January 8, 2018
 @copyright     Copyright © 2018 Branch. All rights reserved.
*/

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

@interface BNCKeyChain : NSObject

/**
 @brief Remove a value for a service and key. Optionally removes all keys and values for a service.

 @param service     The name of the service under which to store the key.
 @param key         The key to remove the value from. If `nil` is passed, all keys and values are removed for that service.
 @return            Returns an `NSError` if an error occurs.
*/
+ (NSError*_Nullable) removeValuesForService:(NSString*_Nullable)service
                                         key:(NSString*_Nullable)key;

/**
 @brief Returns a value for the passed service and key.

 @param service     The name of the service that the value is stored under.
 @param key         The key that the value is stored under.
 @param error       If an error occurs, and `error` is a pointer to an error pointer, the error is returned here.
 @return            Returns the value stored under `service` and `key`, or `nil` if none found.
*/
+ (id _Nullable) retrieveValueForService:(NSString*_Nonnull)service
                                     key:(NSString*_Nonnull)key
                                   error:(NSError*_Nullable __autoreleasing *_Nullable)error;

/**
 @brief Returns an array of all items found in the keychain.

 @param error       If an error occurs, the error is returned in `error` if it is not `NULL`.
 @return            Returns an array of the items stored in the keychain or `nil`.
*/
+ (NSArray*_Nullable) retieveAllValuesWithError:(NSError*_Nullable __autoreleasing *_Nullable)error;

/**
 @brief Stores an item in the keychain.

 @param service     The service name to store the item under.
 @param key         The key to store the item under.
 @param accessGroup The iCloud security access group for sharing the item. Specify `nil` if item should not be shared.
 @return            Returns an error if an error occurs.
 */
+ (NSError*_Nullable) storeValue:(id _Nonnull)value
                      forService:(NSString*_Nonnull)service
                             key:(NSString*_Nonnull)key
                cloudAccessGroup:(NSString*_Nullable)accessGroup;
@end
