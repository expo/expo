/* Copyright (c) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// GTLRObject documentation:
// https://github.com/google/google-api-objectivec-client-for-rest/wiki#objects-and-queries

#import <Foundation/Foundation.h>

#import "GTLRDefines.h"
#import "GTLRDateTime.h"
#import "GTLRDuration.h"

NS_ASSUME_NONNULL_BEGIN

@class GTLRObject;

/**
 *  Protocol that can be implemented to provide custom logic for what class
 *  should be created out of the given JSON.
 */
@protocol GTLRObjectClassResolver <NSObject>
- (Class)classForJSON:(NSDictionary *)json
         defaultClass:(Class)defaultClass;
@end

/**
 *  Standard GTLRObjectClassResolver used by the core library.
 */
@interface GTLRObjectClassResolver : NSObject<GTLRObjectClassResolver>

/**
 *  Returns a resolver that will look up the 'kind' properties to find classes
 *  based on the JSON.
 *
 *  The generated service classes provide a +kindStringToClassMap method for any
 *  mappings that were found from discovery when generating the service.
 */
+ (instancetype)resolverWithKindMap:(NSDictionary<NSString *, Class> *)kindStringToClassMap;

/**
 *  Returns a resolver that will look up the 'kind' properties to find classes
 *  based on the JSON and then applies mapping of surrogate classes to swap out
 *  specific classes.
 *
 *  Surrogates are subclasses to be instantiated instead of standard classes
 *  when creating objects from the JSON. For example, this code will, for one query's
 *  execution, swap a service's default resolver for one that will then use
 *  MyCalendarEventSubclass instead of GTLRCalendarEvent and
 *  MyCalendarReminderSubclass instead of GTLRCalendarReminder.
 *
 * @code
 *  NSDictionary *surrogates = @{
 *    [GTLRCalendarEvent class] : [MyCalendarEventSubclass class]
 *    [GTLRCalendarReminder class] : [MyCalendarReminderSubclass class],
 *  };
 *  NSDictionary *serviceKindMap = [[calendarService class] kindStringToClassMap];
 *  GTLRObjectClassResolver *updatedResolver =
 *    [GTLRObjectClassResolver resolverWithKindMap:serviceKindMap
 *                                       surrogates:surrogates];
 *  query.executionParameters.objectClassResolver = updatedResolver;
 * @endcode
 *
 * @note To install surrogates for all queries executed by the service, use
 *       the service's @c -setSurrogates method.
 */
+ (instancetype)resolverWithKindMap:(NSDictionary<NSString *, Class> *)kindStringToClassMap
                         surrogates:(NSDictionary<Class, Class> *)surrogates;

@end

/**
 * @c GTLRObject serves as the common superclass for classes wrapping JSON, errors, and other data
 * passed in server requests and responses.
 *
 * @note This class is @em not safe for simultaneous use from multiple threads. Applications should
 *       serialize or protect access to a @c GTLRObject instance as they would for any standard
 *       Cocoa mutable container.
 */
@interface GTLRObject : NSObject <NSCopying, NSSecureCoding>

/**
 *  The JSON underlying the property values for this object.
 *
 *  The JSON should be accessed or set using the generated properties of a
 *  class derived from GTLRObject or with the methods @c setJSONValue:forKey:
 *  and @c JSONValueForKey:
 *
 *  @note: Applications should use @c additionalPropertyForKey: when accessing
 *         API object properties that do not have generated @c \@property accessors.
 */
@property(nonatomic, strong, nullable) NSMutableDictionary *JSON;

/**
 *  A dictionary retained by the object for the convenience of the client application.
 *
 *  A client application may use this to retain any dictionary.
 *
 *  The values of the user properties dictionary will not be sent to the server during
 *  query execution, and will not be copied by NSCopying or encoded by NSSecureCoding.
 */
@property(nonatomic, strong) NSDictionary *userProperties;

/////////////////////////////////////////////////////////////////////////////////////////////
//
// Public methods
//
// These methods are intended for users of the library
//
/////////////////////////////////////////////////////////////////////////////////////////////

/**
 *  Constructor for an empty object.
 */
+ (instancetype)object;

/**
 *  Constructor for an object including JSON.
 */
+ (instancetype)objectWithJSON:(nullable NSDictionary *)dict;

/**
 *  Constructor for an object including JSON and providing a resolver to help
 *  select the correct classes for sub objects within the json.
 *
 *  The generated services provide a default resolver (-objectClassResolver)
 *  that covers the kinds for that service. They also expose the kind mappings
 *  via the +kindStringToClassMap method.
 */
+ (instancetype)objectWithJSON:(nullable NSDictionary *)dict
           objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver;

/**
 *  The JSON for the object, or an empty string if there is no JSON or if the JSON
 *  dictionary cannot be represented as JSON.
 */
- (NSString *)JSONString;

/**
 *  Generic access for setting entries in the JSON dictionary.  This creates the JSON dictionary
 *  if necessary.
 *
 *  @note: Applications should use @c setAdditionalProperty:forKey: when setting
 *         API object properties that do not have generated @c \@property accessors.
 */
- (void)setJSONValue:(nullable id)obj forKey:(nonnull NSString *)key;

/**
 *  Generic access to the JSON dictionary.
 *
 *  @note: Applications should use @c additionalPropertyForKey: when accessing
 *         API object properties that do not have generated @c \@property accessors.
 */
- (nullable id)JSONValueForKey:(NSString *)key;

/**
 *  The list of keys in this object's JSON that are not listed as properties on the object.
 */
- (nullable NSArray<NSString *> *)additionalJSONKeys;

/**
 *  Setter for any key in the JSON that is not listed as a @c \@property in the class declaration.
 */
- (void)setAdditionalProperty:(id)obj forName:(NSString *)name;

/**
 *  Accessor for any key in the JSON that is not listed as a @c \@property in the class
 *  declaration.
 */
- (nullable id)additionalPropertyForName:(NSString *)name;

/**
 *  A dictionary of all keys in the JSON that is not listed as a @c \@property in the class
 *  declaration.
 */
- (NSDictionary<NSString *, id> *)additionalProperties;

/**
 *  A string for a partial query describing the fields present.
 *
 *  @note Only the first element of any array is examined.
 *
 *  @see https://developers.google.com/google-apps/tasks/performance?csw=1#partial
 *
 *  @return A @c fields string describing the fields present in the object.
 */
- (NSString *)fieldsDescription;

/**
 *  An object containing only the changes needed to do a partial update (patch),
 *  where the patch would be to change an object from the original to the receiver,
 *  such as
 *    @c GTLRSomeObject *patchObject = [newVersion patchObjectFromOriginal:oldVersion];
 *
 *  @note This method returns nil if there are no changes between the original and the receiver.
 *
 *  @see https://developers.google.com/google-apps/tasks/performance?csw=1#patch
 *
 *  @param original The original object from which to create the patch object.
 *
 *  @return The object used for the patch body.
 */
- (nullable id)patchObjectFromOriginal:(GTLRObject *)original;

/**
 *  A null value to set object properties for patch queries that delete fields.
 *
 *  Do not use this except when setting an object property for a patch query.
 *
 *  @return The null value object.
 */
+ (id)nullValue;

#pragma mark Internal

///////////////////////////////////////////////////////////////////////////////
//
// Protected methods
//
// These methods are intended for subclasses of GTLRObject
//

// Creation of objects from a JSON dictionary. The class created depends on
// the content of the JSON, not the class messaged.
+ (nullable GTLRObject *)objectForJSON:(NSMutableDictionary *)json
                          defaultClass:(nullable Class)defaultClass
                   objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver;

// Property-to-key mapping (for JSON keys which are not used as method names)
+ (nullable NSDictionary<NSString *, NSString *> *)propertyToJSONKeyMap;

// property-to-Class mapping for array properties (to say what is in the array)
+ (nullable NSDictionary<NSString *, Class> *)arrayPropertyToClassMap;

// The default class for additional JSON keys
+ (nullable Class)classForAdditionalProperties;

// Indicates if a "kind" property on this class can be used for the class
// registry or if it appears to be non standard.
+ (BOOL)isKindValidForClassRegistry;

@end

/**
 *  Collection results have a property containing an array of @c GTLRObject
 *
 *  This provides support for @c NSFastEnumeration and for indexed subscripting to
 *  access the objects in the array.
 */
@interface GTLRCollectionObject : GTLRObject<NSFastEnumeration>

/**
 *  The property name that holds the collection.
 *
 *  @return The key for the property holding the array of @c GTLRObject items.
 */
+ (NSString *)collectionItemsKey;

// objectAtIndexedSubscript: will throw if the index is out of bounds (like
// NSArray does).
- (nullable id)objectAtIndexedSubscript:(NSUInteger)idx;

@end

/**
 *  A GTLRDataObject holds media data and the MIME type of the data returned by a media
 *  download query.
 *
 *  The JSON for the object may be nil.
 */
@interface GTLRDataObject : GTLRObject

/**
 *  The downloaded media data.
 */
@property(atomic, strong) NSData *data;

/**
 *  The MIME type of the downloaded media data.
 */
@property(atomic, copy) NSString *contentType;

@end

/**
 *  Base class used when a service method directly returns an array instead
 *  of a JSON object. This exists for the methods not up to spec.
 */
@interface GTLRResultArray : GTLRCollectionObject

/**
 *  This method should only be called by subclasses.
 */
- (nullable NSArray *)itemsWithItemClass:(Class)itemClass;
@end

/**
 *  Helper to call the resolver and find the class to use for the given JSON.
 *  Intended for internal library use only.
 */
Class GTLRObjectResolveClass(
    id<GTLRObjectClassResolver> objectClassResolver,
    NSDictionary *json,
    Class defaultClass);

NS_ASSUME_NONNULL_END
