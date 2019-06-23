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

#if !__has_feature(objc_arc)
#error "This file needs to be compiled with ARC enabled."
#endif

#include <objc/runtime.h>

#import "GTLRObject.h"
#import "GTLRRuntimeCommon.h"
#import "GTLRUtilities.h"

static NSString *const kUserDataPropertyKey = @"_userData";

static NSString *const kGTLRObjectJSONCoderKey = @"json";

static NSMutableDictionary *DeepMutableCopyOfJSONDictionary(NSDictionary *initialJSON);

@interface GTLRObject () <GTLRRuntimeCommon>

@property(nonatomic, strong) id<GTLRObjectClassResolver>objectClassResolver;

@end

@implementation GTLRObject {
  // Any complex object hung off this object goes into the cache so the
  // next fetch will get the same object back instead of having to recreate
  // it.
  NSMutableDictionary *_childCache;
}

@synthesize JSON = _json,
            objectClassResolver = _objectClassResolver,
            userProperties = _userProperties;

+ (instancetype)object {
  return [[self alloc] init];
}

+ (instancetype)objectWithJSON:(NSDictionary *)dict {
  GTLRObject *obj = [self object];
  obj->_json = DeepMutableCopyOfJSONDictionary(dict);
  return obj;
}

+ (instancetype)objectWithJSON:(nullable NSDictionary *)dict
           objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver {
  GTLRObject *obj = [self objectWithJSON:dict];
  obj->_objectClassResolver = objectClassResolver;
  return obj;
}

+ (NSDictionary<NSString *, NSString *> *)propertyToJSONKeyMap {
  return nil;
}

+ (NSDictionary<NSString *, Class> *)arrayPropertyToClassMap {
  return nil;
}

+ (Class)classForAdditionalProperties {
  return Nil;
}

+ (BOOL)isKindValidForClassRegistry {
  return YES;
}

- (BOOL)isEqual:(GTLRObject *)other {
  if (self == other) return YES;
  if (other == nil) return NO;

  // The objects should be the same class, or one should be a subclass of the
  // other's class
  if (![other isKindOfClass:[self class]]
      && ![self isKindOfClass:[other class]]) return NO;

  // What we're not comparing here:
  //   properties
  return GTLR_AreEqualOrBothNil(_json, [other JSON]);
}

// By definition, for two objects to potentially be considered equal,
// they must have the same hash value.  The hash is mostly ignored,
// but removeObjectsInArray: in Leopard does seem to check the hash,
// and NSObject's default hash method just returns the instance pointer.
// We'll define hash here for all of our GTLRObjects.
- (NSUInteger)hash {
  return (NSUInteger) (__bridge void *) [GTLRObject class];
}

- (id)copyWithZone:(NSZone *)zone {
  GTLRObject *newObject = [[[self class] allocWithZone:zone] init];
  newObject.JSON = DeepMutableCopyOfJSONDictionary(self.JSON);
  newObject.objectClassResolver = self.objectClassResolver;

  // What we're not copying:
  //   userProperties
  return newObject;
}

- (NSString *)descriptionWithLocale:(id)locale {
  return self.description;
}

+ (BOOL)supportsSecureCoding {
  return YES;
}

- (instancetype)initWithCoder:(NSCoder *)decoder {
  self = [super init];
  if (self) {
    _json = [decoder decodeObjectOfClass:[NSMutableDictionary class]
                                  forKey:kGTLRObjectJSONCoderKey];
  }
  return self;
}

- (void)encodeWithCoder:(NSCoder *)encoder {
  [encoder encodeObject:_json forKey:kGTLRObjectJSONCoderKey];
}

#pragma mark JSON values

- (void)setJSONValue:(id)obj forKey:(NSString *)key {
  NSMutableDictionary *dict = self.JSON;
  if (dict == nil && obj != nil) {
    dict = [NSMutableDictionary dictionaryWithCapacity:1];
    self.JSON = dict;
  }
  [dict setValue:obj forKey:key];
}

- (id)JSONValueForKey:(NSString *)key {
  id obj = [self.JSON objectForKey:key];
  return obj;
}

- (NSString *)JSONString {
  NSError *error;
  NSDictionary *json = self.JSON;
  if (json) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:json
                                                   options:NSJSONWritingPrettyPrinted
                                                     error:&error];
    GTLR_DEBUG_ASSERT(data != nil, @"JSONString generate failed: %@\n JSON: %@", error, json);
    if (data) {
      NSString *jsonStr = [[NSString alloc] initWithData:data
                                                encoding:NSUTF8StringEncoding];
      if (jsonStr) return jsonStr;
    }
  }
  return @"";
}

- (NSArray<NSString *> *)additionalJSONKeys {
  NSArray *knownKeys = [[self class] allKnownKeys];
  NSMutableArray *result;
  NSArray *allKeys = _json.allKeys;
  if (allKeys) {
    result = [NSMutableArray arrayWithArray:allKeys];
    [result removeObjectsInArray:knownKeys];
    // Return nil instead of an empty array.
    if (result.count == 0) {
      result = nil;
    }
  }
  return result;
}

#pragma mark Partial - Fields

- (NSString *)fieldsDescription {
  NSString *str = [GTLRObject fieldsDescriptionForJSON:self.JSON];
  return str;
}

+ (NSString *)fieldsDescriptionForJSON:(NSDictionary *)targetJSON {
  // Internal routine: recursively generate a string field description
  // by joining elements
  NSArray *array = [self fieldsElementsForJSON:targetJSON];
  NSString *str = [array componentsJoinedByString:@","];
  return str;
}

+ (NSArray *)fieldsElementsForJSON:(NSDictionary *)targetJSON {
  // Internal routine: recursively generate an array of field description
  // element strings
  NSMutableArray *resultFields = [NSMutableArray array];

  // Sorting the dictionary keys gives us deterministic results when iterating
  NSArray *sortedKeys = [targetJSON.allKeys sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
  for (NSString *key in sortedKeys) {
    // We'll build a comma-separated list of fields
    id value = [targetJSON objectForKey:key];
    if ([value isKindOfClass:[NSString class]]
        || [value isKindOfClass:[NSNumber class]]) {
      // Basic type (string, number), so the key is what we want
      [resultFields addObject:key];
    } else if ([value isKindOfClass:[NSDictionary class]]) {
      // Object (dictionary): "parent/child1,parent/child2,parent/child3"
      NSArray *subElements = [self fieldsElementsForJSON:value];
      for (NSString *subElem in subElements) {
        NSString *prepended = [NSString stringWithFormat:@"%@/%@",
                               key, subElem];
        [resultFields addObject:prepended];
      }
    } else if ([value isKindOfClass:[NSArray class]]) {
      // Array; we'll generate from the first array entry:
      // "parent(child1,child2,child3)"
      //
      // Open question: should this instead create the union of elements for
      // all items in the array, rather than just get fields from the first
      // array object?
      if (((NSArray *)value).count > 0) {
        id firstObj = [value objectAtIndex:0];
        if ([firstObj isKindOfClass:[NSDictionary class]]) {
          // An array of objects
          NSString *contentsStr = [self fieldsDescriptionForJSON:firstObj];
          NSString *encapsulated = [NSString stringWithFormat:@"%@(%@)",
                                    key, contentsStr];
          [resultFields addObject:encapsulated];
        } else {
          // An array of some basic type, or of arrays
          [resultFields addObject:key];
        }
      }
    } else {
      GTLR_ASSERT(0, @"GTLRObject unknown field element for %@ (%@)",
                  key, NSStringFromClass([value class]));
    }
  }
  return resultFields;
}

#pragma mark Partial - Patch

- (id)patchObjectFromOriginal:(GTLRObject *)original {
  GTLRObject *resultObj;
  NSMutableDictionary *resultJSON = [GTLRObject patchDictionaryForJSON:self.JSON
                                                      fromOriginalJSON:original.JSON];
  if (resultJSON.count > 0) {
    // Avoid an extra copy by assigning the JSON directly rather than using +objectWithJSON:
    resultObj = [[self class] object];
    resultObj.JSON = resultJSON;
  } else {
    // Client apps should not attempt to patch with an object containing
    // empty JSON
    resultObj = nil;
  }
  return resultObj;
}

+ (NSMutableDictionary *)patchDictionaryForJSON:(NSDictionary *)newJSON
                               fromOriginalJSON:(NSDictionary *)originalJSON {
  // Internal recursive routine to create an object suitable for
  // our patch semantics
  NSMutableDictionary *resultJSON = [NSMutableDictionary dictionary];

  // Iterate through keys present in the old object
  NSArray *originalKeys = originalJSON.allKeys;
  for (NSString *key in originalKeys) {
    id originalValue = [originalJSON objectForKey:key];
    id newValue = [newJSON valueForKey:key];
    if (newValue == nil) {
      // There is no new value for this key, so set the value to NSNull
      [resultJSON setValue:[NSNull null] forKey:key];
    } else if (!GTLR_AreEqualOrBothNil(originalValue, newValue)) {
      // The values for this key differ
      if ([originalValue isKindOfClass:[NSDictionary class]]
          && [newValue isKindOfClass:[NSDictionary class]]) {
        // Both are objects; recurse
        NSMutableDictionary *subDict = [self patchDictionaryForJSON:newValue
                                                   fromOriginalJSON:originalValue];
        [resultJSON setValue:subDict forKey:key];
      } else {
        // They are non-object values; the new replaces the old. Per the
        // documentation for patch, this replaces entire arrays.
        [resultJSON setValue:newValue forKey:key];
      }
    } else {
      // The values are the same; omit this key-value pair
    }
  }

  // Iterate through keys present only in the new object, and add them to the
  // result
  NSMutableArray *newKeys = [NSMutableArray arrayWithArray:newJSON.allKeys];
  [newKeys removeObjectsInArray:originalKeys];

  for (NSString *key in newKeys) {
    id value = [newJSON objectForKey:key];
    [resultJSON setValue:value forKey:key];
  }
  return resultJSON;
}

+ (id)nullValue {
  return [NSNull null];
}

#pragma mark Additional Properties

- (id)additionalPropertyForName:(NSString *)name {
  // Return the cached object, if any, before creating one.
  id result = [self cacheChildForKey:name];
  if (result != nil) {
    return result;
  }

  Class defaultClass = [[self class] classForAdditionalProperties];
  id jsonObj = [self JSONValueForKey:name];
  BOOL shouldCache = NO;
  if (jsonObj != nil) {
    id<GTLRObjectClassResolver>objectClassResolver = self.objectClassResolver;
    result = [GTLRRuntimeCommon objectFromJSON:jsonObj
                                  defaultClass:defaultClass
                           objectClassResolver:objectClassResolver
                                   isCacheable:&shouldCache];
  }

  [self setCacheChild:(shouldCache ? result : nil)
               forKey:name];
  return result;
}

- (void)setAdditionalProperty:(id)obj forName:(NSString *)name {
  BOOL shouldCache = NO;
  Class defaultClass = [[self class] classForAdditionalProperties];
  id json = [GTLRRuntimeCommon jsonFromAPIObject:obj
                                   expectedClass:defaultClass
                                     isCacheable:&shouldCache];
  [self setJSONValue:json forKey:name];
  [self setCacheChild:(shouldCache ? obj : nil)
               forKey:name];
}

- (NSDictionary<NSString *, id> *)additionalProperties {
  NSMutableDictionary *result = [NSMutableDictionary dictionary];

  NSArray *propertyNames = [self additionalJSONKeys];
  for (NSString *name in propertyNames) {
    id obj = [self additionalPropertyForName:name];
    [result setObject:obj forKey:name];
  }

  return result;
}

#pragma mark Child Cache methods

// There is no property for _childCache as there shouldn't be KVC/KVO
// support for it, it's an implementation detail.

- (void)setCacheChild:(id)obj forKey:(NSString *)key {
  if (_childCache == nil && obj != nil) {
    _childCache = [[NSMutableDictionary alloc] initWithObjectsAndKeys:
                   obj, key, nil];
  } else {
    [_childCache setValue:obj forKey:key];
  }
}

- (id)cacheChildForKey:(NSString *)key {
  id obj = [_childCache objectForKey:key];
  return obj;
}

#pragma mark Support methods

+ (NSMutableArray *)allDeclaredProperties {
  NSMutableArray *array = [NSMutableArray array];

  // walk from this class up the hierarchy to GTLRObject
  Class topClass = class_getSuperclass([GTLRObject class]);
  for (Class currClass = self;
       currClass != topClass;
       currClass = class_getSuperclass(currClass)) {
    // step through this class's properties, and add the property names to the
    // array
    objc_property_t *properties = class_copyPropertyList(currClass, NULL);
    if (properties) {
      for (objc_property_t *prop = properties;
           *prop != NULL;
           ++prop) {
        const char *propName = property_getName(*prop);
        // We only want dynamic properties; their attributes contain ",D".
        const char *attr = property_getAttributes(*prop);
        const char *dynamicMarker = strstr(attr, ",D");
        if (dynamicMarker &&
            (dynamicMarker[2] == 0 || dynamicMarker[2] == ',' )) {
          [array addObject:(id _Nonnull)@(propName)];
        }
      }
      free(properties);
    }
  }
  return array;
}

+ (NSArray *)allKnownKeys {
  NSArray *allProps = [self allDeclaredProperties];
  NSMutableArray *knownKeys = [NSMutableArray arrayWithArray:allProps];

  NSDictionary *propMap = [GTLRObject propertyToJSONKeyMapForClass:[self class]];

  NSUInteger idx = 0;
  for (NSString *propName in allProps) {
    NSString *jsonKey = [propMap objectForKey:propName];
    if (jsonKey) {
      [knownKeys replaceObjectAtIndex:idx
                           withObject:jsonKey];
    }
    ++idx;
  }
  return knownKeys;
}

- (NSString *)description {
  NSString *jsonDesc = [self JSONDescription];

  NSString *str = [NSString stringWithFormat:@"%@ %p: %@",
                   [self class], self, jsonDesc];
  return str;
}

// Internal utility for creating an appropriate description summary for the object's JSON.
- (NSString *)JSONDescription {
  // Find the list of declared and otherwise known JSON keys for this class.
  NSArray *knownKeys = [[self class] allKnownKeys];

  NSMutableString *descStr = [NSMutableString stringWithString:@"{"];

  NSString *spacer = @"";
  for (NSString *key in [[_json allKeys] sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)]) {
    NSString *value = nil;
    // show question mark for JSON keys not supported by a declared property:
    //   foo?:"Hi mom."
    NSString *qmark = [knownKeys containsObject:key] ? @"" : @"?";

    // determine property value to dislay
    id rawValue = [_json valueForKey:key];
    if ([rawValue isKindOfClass:[NSDictionary class]]) {
      // for dictionaries, show the list of keys:
      //   {key1,key2,key3}
      NSArray *subKeys = [((NSDictionary *)rawValue).allKeys sortedArrayUsingSelector:@selector(caseInsensitiveCompare:)];
      NSString *subkeyList = [subKeys componentsJoinedByString:@","];
      value = [NSString stringWithFormat:@"{%@}", subkeyList];
    } else if ([rawValue isKindOfClass:[NSArray class]]) {
      // for arrays, show the number of items in the array:
      //   [3]
      value = [NSString stringWithFormat:@"[%tu]", ((NSArray *)rawValue).count];
    } else if ([rawValue isKindOfClass:[NSString class]]) {
      // for strings, show the string in quotes:
      //   "Hi mom."
      value = [NSString stringWithFormat:@"\"%@\"", rawValue];
    } else {
      // for numbers, show just the number
      value = [rawValue description];
    }
    [descStr appendFormat:@"%@%@%@:%@", spacer, key, qmark, value];
    spacer = @" ";
  }
  [descStr appendString:@"}"];
  return descStr;
}

#pragma mark Object Instantiation

+ (GTLRObject *)objectForJSON:(NSMutableDictionary *)json
                 defaultClass:(Class)defaultClass
          objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver {
  if (((id)json == [NSNull null]) || json.count == 0) {
    if (json != nil && defaultClass != Nil) {
      // The JSON included an empty dictionary, just create the object.
      Class classToCreate =
        GTLRObjectResolveClass(objectClassResolver,
                               [NSDictionary dictionary],
                               defaultClass);
      return [classToCreate object];
    }
    // No actual result, such as the response from a delete.
    return nil;
  }

  if (defaultClass == Nil) {
    defaultClass = self;
  }

  Class classToCreate =
    GTLRObjectResolveClass(objectClassResolver, json, defaultClass);

  // now instantiate the GTLRObject
  GTLRObject *parsedObject = [classToCreate object];
  parsedObject.objectClassResolver = objectClassResolver;
  parsedObject.JSON = json;
  return parsedObject;
}

#pragma mark Runtime Utilities

static NSMutableDictionary *gJSONKeyMapCache = nil;
static NSMutableDictionary *gArrayPropertyToClassMapCache = nil;

+ (void)initialize {
  // Note that initialize is guaranteed by the runtime to be called in a
  // thread-safe manner
  if (gJSONKeyMapCache == nil) {
    gJSONKeyMapCache = [[NSMutableDictionary alloc] init];
  }
  if (gArrayPropertyToClassMapCache == nil) {
    gArrayPropertyToClassMapCache = [[NSMutableDictionary alloc] init];
  }
}

+ (NSDictionary *)propertyToJSONKeyMapForClass:(Class<GTLRRuntimeCommon>)aClass {
  NSDictionary *resultMap =
    [GTLRRuntimeCommon mergedClassDictionaryForSelector:@selector(propertyToJSONKeyMap)
                                             startClass:aClass
                                          ancestorClass:[GTLRObject class]
                                                  cache:gJSONKeyMapCache];
  return resultMap;
}

+ (NSDictionary *)arrayPropertyToClassMapForClass:(Class<GTLRRuntimeCommon>)aClass {
  NSDictionary *resultMap =
    [GTLRRuntimeCommon mergedClassDictionaryForSelector:@selector(arrayPropertyToClassMap)
                                             startClass:aClass
                                          ancestorClass:[GTLRObject class]
                                                  cache:gArrayPropertyToClassMapCache];
  return resultMap;
}

#pragma mark Runtime Support

+ (Class<GTLRRuntimeCommon>)ancestorClass {
  return [GTLRObject class];
}

+ (BOOL)resolveInstanceMethod:(SEL)sel {
  BOOL resolved = [GTLRRuntimeCommon resolveInstanceMethod:sel onClass:self];
  if (resolved)
    return YES;

  return [super resolveInstanceMethod:sel];
}

@end

@implementation GTLRCollectionObject

+ (NSString *)collectionItemsKey {
  // GTLRCollectionObject fast enumeration, indexed access, and automatic pagination
  // (when shouldFetchNextPages is enabled) applies to the object array property "items".
  // The array property's key may be different if subclasses override this method.
  return @"items";
}

- (id)objectAtIndexedSubscript:(NSUInteger)idx {
  NSString *key = [[self class] collectionItemsKey];
  NSArray *items = [self valueForKey:key];
  if (items == nil) {
    [NSException raise:NSRangeException
                format:@"index %tu beyond bounds (%@ property \"%@\" is nil)",
                       idx, [self class], key];
  }
  id result = [items objectAtIndexedSubscript:idx];
  return result;
}

// NSFastEnumeration protocol
- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state
                                  objects:(__unsafe_unretained id _Nonnull *)stackbuf
                                    count:(NSUInteger)len {
  NSString *key = [[self class] collectionItemsKey];
  NSArray *items = [self valueForKey:key];
  NSUInteger result = [items countByEnumeratingWithState:state
                                                 objects:stackbuf
                                                   count:len];
  return result;
}

@end

@implementation GTLRDataObject

@synthesize data = _data,
            contentType = _contentType;

- (NSString *)description {
  NSString *jsonDesc = @"";
  if (self.JSON.count > 0) {
    jsonDesc = [self JSONDescription];
  }
  return [NSString stringWithFormat:@"%@ %p: %tu bytes, contentType:%@ %@",
          [self class], self, self.data.length, self.contentType, jsonDesc];
}

- (id)copyWithZone:(NSZone *)zone {
  GTLRDataObject *newObj = [super copyWithZone:zone];
  newObj.data = [self.data copy];
  newObj.contentType = self.contentType;
  return newObj;
}

@end

@implementation GTLRResultArray

- (NSArray *)itemsWithItemClass:(Class)itemClass {
  // Return the cached array before creating on demand.
  NSString *cacheKey = @"result_array_items";
  NSMutableArray *cachedArray = [self cacheChildForKey:cacheKey];
  if (cachedArray != nil) {
    return cachedArray;
  }
  NSArray *result = nil;
  NSArray *array = (NSArray *)self.JSON;
  if (array != nil) {
    if ([array isKindOfClass:[NSArray class]]) {
      id<GTLRObjectClassResolver>objectClassResolver = self.objectClassResolver;
      result = [GTLRRuntimeCommon objectFromJSON:array
                                    defaultClass:itemClass
                             objectClassResolver:objectClassResolver
                                     isCacheable:NULL];
    } else {
#if DEBUG
      if (![array isKindOfClass:[NSNull class]]) {
        GTLR_DEBUG_LOG(@"GTLRObject: unexpected JSON: %@ should be an array, actually is a %@:\n%@",
                       NSStringFromClass([self class]),
                       NSStringFromClass([array class]),
                       array);
      }
#endif
      result = array;
    }
  }

  [self setCacheChild:result forKey:cacheKey];
  return result;
}

- (NSString *)JSONDescription {
  // Just like GTLRObject's handing of arrays, just return the count.
  return [NSString stringWithFormat:@"[%tu]", self.JSON.count];
}

@end

Class GTLRObjectResolveClass(
    id<GTLRObjectClassResolver>objectClassResolver,
    NSDictionary *json,
    Class defaultClass) {
  Class result = [objectClassResolver classForJSON:json
                                      defaultClass:defaultClass];
  if (result == Nil) {
    result = defaultClass;
  }
  return result;
}

@implementation GTLRObjectClassResolver {
  NSDictionary<NSString *, Class> *_kindToClassMap;
  NSDictionary<Class, Class> *_surrogates;
}

+ (instancetype)resolverWithKindMap:(NSDictionary<NSString *, Class> *)kindStringToClassMap {
  GTLRObjectClassResolver *result = [[self alloc] initWithKindMap:kindStringToClassMap
                                                       surrogates:nil];
  return result;
}

+ (instancetype)resolverWithKindMap:(NSDictionary<NSString *, Class> *)kindStringToClassMap
                         surrogates:(NSDictionary<Class, Class> *)surrogates {
  GTLRObjectClassResolver *result = [[self alloc] initWithKindMap:kindStringToClassMap
                                                       surrogates:surrogates];
  return result;
}

- (instancetype)initWithKindMap:(NSDictionary<NSString *, Class> *)kindStringToClassMap
                     surrogates:(NSDictionary<Class, Class> *)surrogates {
  self = [super init];
  if (self) {
    _kindToClassMap = [kindStringToClassMap copy];
    _surrogates = [surrogates copy];
  }
  return self;
}

- (Class)classForJSON:(NSDictionary *)json
         defaultClass:(Class)defaultClass {
  Class result = defaultClass;

  // Apply kind map.
  BOOL shouldUseKind = (result == Nil) || [result isKindValidForClassRegistry];
  if (shouldUseKind && [json isKindOfClass:[NSDictionary class]]) {
    NSString *kind = [json valueForKey:@"kind"];
    if ([kind isKindOfClass:[NSString class]] && kind.length > 0) {
      Class dynamicClass = [_kindToClassMap objectForKey:kind];
      if (dynamicClass) {
        result = dynamicClass;
      }
    }
  }

  // Apply surrogate map.
  Class surrogate = [_surrogates objectForKey:result];
  if (surrogate) {
    result = surrogate;
  }

  return result;
}

@end

static NSMutableDictionary *DeepMutableCopyOfJSONDictionary(NSDictionary *initialJSON) {
  if (!initialJSON) return nil;

  NSMutableDictionary *result;
  CFPropertyListRef ref = CFPropertyListCreateDeepCopy(kCFAllocatorDefault,
                                                       (__bridge CFPropertyListRef)(initialJSON),
                                                       kCFPropertyListMutableContainers);
  if (ref) {
    result = CFBridgingRelease(ref);
  } else {
    // Failed to copy, probably due to a non-plist type such as NSNull.
    //
    // As a fallback, round-trip through NSJSONSerialization.
    NSError *serializationError;
    NSData *data = [NSJSONSerialization dataWithJSONObject:initialJSON
                                                   options:0
                                                     error:&serializationError];
    if (!data) {
      GTLR_DEBUG_ASSERT(0, @"Copy failed due to serialization: %@\nJSON: %@",
                        serializationError, initialJSON);
    } else {
      result = [NSJSONSerialization JSONObjectWithData:data
                                                options:NSJSONReadingMutableContainers
                                                  error:&serializationError];
      GTLR_DEBUG_ASSERT(result != nil, @"Copy failed due to deserialization: %@\nJSON: %@",
                        serializationError,
                        [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]);
    }
  }
  return result;
}
