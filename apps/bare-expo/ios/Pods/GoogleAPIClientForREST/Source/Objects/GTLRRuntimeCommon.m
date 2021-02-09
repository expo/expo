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
#include <TargetConditionals.h>

#import "GTLRRuntimeCommon.h"

#import "GTLRDefines.h"
#import "GTLRDateTime.h"
#import "GTLRDuration.h"
#import "GTLRObject.h"
#import "GTLRUtilities.h"

// Note: NSObject's class is used as a marker for the expected/default class
// when Discovery says it can be any type of object.

@implementation GTLRRuntimeCommon

// Helper to generically convert JSON to an api object type.
+ (id)objectFromJSON:(id)json
        defaultClass:(Class)defaultClass
 objectClassResolver:(id<GTLRObjectClassResolver>)objectClassResolver
         isCacheable:(BOOL*)isCacheable {
  id result = nil;
  BOOL canBeCached = YES;

  // TODO(TVL): use defaultClass to validate things like expectedClass is
  // done in jsonFromAPIObject:expectedClass:isCacheable:?

  if ([json isKindOfClass:[NSDictionary class]]) {
    // If no default, or the default was any object, then default to base
    // object here (and hope there is a kind to get the right thing).
    if ((defaultClass == Nil) || [defaultClass isEqual:[NSObject class]]) {
      defaultClass = [GTLRObject class];
    }
    result = [GTLRObject objectForJSON:json
                          defaultClass:defaultClass
                   objectClassResolver:objectClassResolver];
  } else if ([json isKindOfClass:[NSArray class]]) {
    NSArray *jsonArray = json;
    // make an object for each JSON dictionary in the array
    NSMutableArray *resultArray = [NSMutableArray arrayWithCapacity:jsonArray.count];
    for (id jsonItem in jsonArray) {
      id item = [self objectFromJSON:jsonItem
                        defaultClass:defaultClass
                 objectClassResolver:objectClassResolver
                         isCacheable:NULL];
      [resultArray addObject:item];
    }
    result = resultArray;
  } else if ([json isKindOfClass:[NSString class]]) {
    // DateTimes and Durations live in JSON as strings, so convert.
    if ([defaultClass isEqual:[GTLRDateTime class]]) {
      result = [GTLRDateTime dateTimeWithRFC3339String:json];
    } else if ([defaultClass isEqual:[GTLRDuration class]]) {
      result = [GTLRDuration durationWithJSONString:json];
    } else if ([defaultClass isEqual:[NSNumber class]]) {
      result = GTLR_EnsureNSNumber(json);
      canBeCached = NO;
    } else {
      result = json;
      canBeCached = NO;
    }
  } else if ([json isKindOfClass:[NSNumber class]] ||
             [json isKindOfClass:[NSNull class]]) {
    result = json;
    canBeCached = NO;
  } else {
    GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: unsupported class '%s' in objectFromJSON",
                   class_getName([json class]));
  }

  if (isCacheable) {
    *isCacheable = canBeCached;
  }
  return result;
}

// Helper to generically convert an api object type to JSON.
// |expectedClass| is the type that was expected for |obj|.
+ (id)jsonFromAPIObject:(id)obj
          expectedClass:(Class)expectedClass
            isCacheable:(BOOL *)isCacheable {
  id result = nil;
  BOOL canBeCached = YES;
  BOOL checkExpected = (expectedClass != Nil);

  if ([obj isKindOfClass:[NSString class]]) {
    result = [obj copy];
    canBeCached = NO;
  } else if ([obj isKindOfClass:[NSNumber class]] ||
             [obj isKindOfClass:[NSNull class]]) {
      result = obj;
      canBeCached = NO;
  } else if ([obj isKindOfClass:[GTLRObject class]]) {
    result = [(GTLRObject *)obj JSON];
    if (result == nil) {
      // adding an empty object; it should have a JSON dictionary so it can
      // hold future assignments
      [(GTLRObject *)obj setJSON:[NSMutableDictionary dictionary]];
      result = [(GTLRObject *)obj JSON];
    }
  } else if ([obj isKindOfClass:[NSArray class]]) {
    checkExpected = NO;
    NSArray *array = obj;
    // get the JSON for each thing in the array
    NSMutableArray *resultArray = [NSMutableArray arrayWithCapacity:array.count];
    for (id item in array) {
      id itemJSON = [self jsonFromAPIObject:item
                              expectedClass:expectedClass
                                isCacheable:NULL];
      [resultArray addObject:itemJSON];
    }
    result = resultArray;
  } else if ([obj isKindOfClass:[GTLRDateTime class]]) {
    // DateTimes live in JSON as strings, so convert.
    GTLRDateTime *dateTime = obj;
    result = dateTime.RFC3339String;
  } else if ([obj isKindOfClass:[GTLRDuration class]]) {
    // Durations live in JSON as strings, so convert.
    GTLRDuration *duration = obj;
    result = duration.jsonString;
  } else {
    checkExpected = NO;
    if (obj) {
      GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: unsupported class '%s' in jsonFromAPIObject",
                     class_getName([obj class]));
    }
  }

  if (checkExpected) {
    // If the default was any object, then clear it to skip validation checks.
    if ([expectedClass isEqual:[NSObject class]] ||
        [obj isKindOfClass:[NSNull class]]) {
      expectedClass = nil;
    }
    if (expectedClass && ![obj isKindOfClass:expectedClass]) {
      GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: jsonFromAPIObject expected class '%s' instead got '%s'",
                     class_getName(expectedClass), class_getName([obj class]));
    }
  }

  if (isCacheable) {
    *isCacheable = canBeCached;
  }
  return result;
}

+ (NSDictionary *)mergedClassDictionaryForSelector:(SEL)selector
                                        startClass:(Class)startClass
                                     ancestorClass:(Class)ancestorClass
                                             cache:(NSMutableDictionary *)cache {
  NSDictionary *result;
  @synchronized(cache) {
    result = [cache objectForKey:startClass];
    if (result == nil) {
      // Collect the class's dictionary.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      NSDictionary *classDict = [startClass performSelector:selector];
#pragma clang diagnostic pop

      // Collect the parent class's merged dictionary.
      NSDictionary *parentClassMergedDict;
      if ([startClass isEqual:ancestorClass]) {
        parentClassMergedDict = nil;
      } else {
        Class parentClass = class_getSuperclass(startClass);
        parentClassMergedDict =
          [self mergedClassDictionaryForSelector:selector
                                      startClass:parentClass
                                   ancestorClass:ancestorClass
                                           cache:cache];
      }

      // Merge this class's into the parent's so things properly override.
      NSMutableDictionary *mergeDict;
      if (parentClassMergedDict != nil) {
        mergeDict =
          [NSMutableDictionary dictionaryWithDictionary:parentClassMergedDict];
      } else {
        mergeDict = [NSMutableDictionary dictionary];
      }
      if (classDict != nil) {
        [mergeDict addEntriesFromDictionary:classDict];
      }

      // Make an immutable version.
      result = [NSDictionary dictionaryWithDictionary:mergeDict];

      // Save it.
      [cache setObject:result forKey:(id<NSCopying>)startClass];
    }
  }
  return result;
}

#pragma mark Runtime lookup support

static objc_property_t PropertyForSel(Class<GTLRRuntimeCommon> startClass,
                                      SEL sel, BOOL isSetter,
                                      Class<GTLRRuntimeCommon> *outFoundClass) {
  const char *selName = sel_getName(sel);
  const char *baseName = selName;
  size_t baseNameLen = strlen(baseName);
  if (isSetter) {
    baseName += 3;    // skip "set"
    baseNameLen -= 4; // subtract "set" and the final colon
  }

  // walk from this class up the hierarchy to the ancestor class
  Class<GTLRRuntimeCommon> topClass = class_getSuperclass([startClass ancestorClass]);
  for (Class currClass = startClass;
       currClass != topClass;
       currClass = class_getSuperclass(currClass)) {
    // step through this class's properties
    objc_property_t foundProp = NULL;
    objc_property_t *properties = class_copyPropertyList(currClass, NULL);
    if (properties) {
      for (objc_property_t *prop = properties; *prop != NULL; ++prop) {
        const char *propAttrs = property_getAttributes(*prop);
        const char *dynamicMarker = strstr(propAttrs, ",D");
        if (!dynamicMarker ||
            (dynamicMarker[2] != 0 && dynamicMarker[2] != ',' )) {
          // It isn't dynamic, skip it.
          continue;
        }

        if (!isSetter) {
          // See if this property has an explicit getter=. (the attributes always start with a T,
          // so we can check for the leading ','.
          const char *getterMarker = strstr(propAttrs, ",G");
          if (getterMarker) {
            const char *getterStart = getterMarker + 2;
            const char *getterEnd = getterStart;
            while ((*getterEnd != 0) && (*getterEnd != ',')) {
              ++getterEnd;
            }
            size_t getterLen = (size_t)(getterEnd - getterStart);
            if ((strncmp(selName, getterStart, getterLen) == 0)
                && (selName[getterLen] == 0)) {
              // return the actual property
              foundProp = *prop;
              // if requested, return the class containing the property
              if (outFoundClass) *outFoundClass = currClass;
              break;
            }
          }  // if (getterMarker)
        }  // if (!isSetter)

        // Search for an exact-name match (a getter), but case-insensitive on the
        // first character (in case baseName comes from a setter)
        const char *propName = property_getName(*prop);
        size_t propNameLen = strlen(propName);
        if (baseNameLen == propNameLen
            && strncasecmp(baseName, propName, 1) == 0
            && (baseNameLen <= 1
                || strncmp(baseName + 1, propName + 1, baseNameLen - 1) == 0)) {
          // return the actual property
          foundProp = *prop;

          // if requested, return the class containing the property
          if (outFoundClass) *outFoundClass = currClass;
          break;
        }
      }  // for (prop in properties)
      free(properties);
    }
    if (foundProp) return foundProp;
  }

  // not found; this occasionally happens when the system looks for a method
  // like "getFoo" or "descriptionWithLocale:indent:"
  return NULL;
}

typedef NS_ENUM(NSUInteger, GTLRPropertyType) {
#if !defined(__LP64__) || !__LP64__
  // These two only needed in 32bit builds since NSInteger in 64bit ends up in the LongLong paths.
  GTLRPropertyTypeInt32 = 1,
  GTLRPropertyTypeUInt32,
#endif
  GTLRPropertyTypeLongLong = 3,
  GTLRPropertyTypeULongLong,
  GTLRPropertyTypeFloat,
  GTLRPropertyTypeDouble,
  GTLRPropertyTypeBool,
  GTLRPropertyTypeNSString,
  GTLRPropertyTypeNSNumber,
  GTLRPropertyTypeGTLRDateTime,
  GTLRPropertyTypeGTLRDuration,
  GTLRPropertyTypeNSArray,
  GTLRPropertyTypeNSObject,
  GTLRPropertyTypeGTLRObject,
};

typedef struct {
  const char *attributePrefix;

  GTLRPropertyType propertyType;
  const char *setterEncoding;
  const char *getterEncoding;

  // These are the "fixed" return classes, but some properties will require
  // looking up the return class instead (because it is a subclass of
  // GTLRObject).
  const char *returnClassName;
  Class       returnClass;
  BOOL extractReturnClass;

} GTLRDynamicImpInfo;

static const GTLRDynamicImpInfo *DynamicImpInfoForProperty(objc_property_t prop,
                                                           Class *outReturnClass) {

  if (outReturnClass) *outReturnClass = nil;

  // dynamic method resolution:
  // http://developer.apple.com/library/ios/#documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtDynamicResolution.html
  //
  // property runtimes:
  // http://developer.apple.com/library/ios/#documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtPropertyIntrospection.html

  // Get and parse the property attributes, which look something like
  //   T@"NSString",&,D,P
  //   Ti,D -- NSInteger on 32bit
  //   Tq,D -- NSInteger on 64bit, long long on 32bit & 64bit
  //   TB,D -- BOOL comes as bool on 64bit iOS
  //   Tc,D -- BOOL comes as char otherwise
  //   T@"NSString",D
  //   T@"GTLRLink",D
  //   T@"NSArray",D


  static GTLRDynamicImpInfo kImplInfo[] = {
#if !defined(__LP64__) || !__LP64__
    { // NSInteger on 32bit
      "Ti",
      GTLRPropertyTypeInt32,
      "v@:i",
      "i@:",
      nil, nil,
      NO
    },
    { // NSUInteger on 32bit
      "TI",
      GTLRPropertyTypeUInt32,
      "v@:I",
      "I@:",
      nil, nil,
      NO
    },
#endif
    { // NSInteger on 64bit, long long on 32bit and 64bit.
      "Tq",
      GTLRPropertyTypeLongLong,
      "v@:q",
      "q@:",
      nil, nil,
      NO
    },
    { // NSUInteger on 64bit, long long on 32bit and 64bit.
      "TQ",
      GTLRPropertyTypeULongLong,
      "v@:Q",
      "Q@:",
      nil, nil,
      NO
    },
    { // float
      "Tf",
      GTLRPropertyTypeFloat,
      "v@:f",
      "f@:",
      nil, nil,
      NO
    },
    { // double
      "Td",
      GTLRPropertyTypeDouble,
      "v@:d",
      "d@:",
      nil, nil,
      NO
    },
#if defined(OBJC_BOOL_IS_BOOL) && OBJC_BOOL_IS_BOOL
    { // BOOL as bool
      "TB",
      GTLRPropertyTypeBool,
      "v@:B",
      "B@:",
      nil, nil,
      NO
    },
#elif defined(OBJC_BOOL_IS_CHAR) && OBJC_BOOL_IS_CHAR
    { // BOOL as char
      "Tc",
      GTLRPropertyTypeBool,
      "v@:c",
      "c@:",
      nil, nil,
      NO
    },
#else
 #error unknown definition for ObjC BOOL type
#endif
    { // NSString
      "T@\"NSString\"",
      GTLRPropertyTypeNSString,
      "v@:@",
      "@@:",
      "NSString", nil,
      NO
    },
    { // NSNumber
      "T@\"NSNumber\"",
      GTLRPropertyTypeNSNumber,
      "v@:@",
      "@@:",
      "NSNumber", nil,
      NO
    },
    { // GTLRDateTime
      "T@\"" GTLR_CLASSNAME_CSTR(GTLRDateTime) "\"",
      GTLRPropertyTypeGTLRDateTime,
      "v@:@",
      "@@:",
      GTLR_CLASSNAME_CSTR(GTLRDateTime), nil,
      NO
    },
    { // GTLRDuration
      "T@\"" GTLR_CLASSNAME_CSTR(GTLRDuration) "\"",
      GTLRPropertyTypeGTLRDuration,
      "v@:@",
      "@@:",
      GTLR_CLASSNAME_CSTR(GTLRDuration), nil,
      NO
    },
    { // NSArray with type
      "T@\"NSArray\"",
      GTLRPropertyTypeNSArray,
      "v@:@",
      "@@:",
      "NSArray", nil,
      NO
    },
    { // id (any of the objects above)
      "T@,",
      GTLRPropertyTypeNSObject,
      "v@:@",
      "@@:",
      "NSObject", nil,
      NO
    },
    { // GTLRObject - Last, cause it's a special case and prefix is general
      "T@\"",
      GTLRPropertyTypeGTLRObject,
      "v@:@",
      "@@:",
      nil, nil,
      YES
    },
  };

  static BOOL hasLookedUpClasses = NO;
  if (!hasLookedUpClasses) {
    // Unfortunately, you can't put [NSString class] into the static structure,
    // so this lookup has to be done at runtime.
    hasLookedUpClasses = YES;
    for (uint32_t idx = 0; idx < sizeof(kImplInfo)/sizeof(kImplInfo[0]); ++idx) {
      if (kImplInfo[idx].returnClassName) {
        kImplInfo[idx].returnClass = objc_getClass(kImplInfo[idx].returnClassName);
        NSCAssert1(kImplInfo[idx].returnClass != nil,
                   @"GTLRRuntimeCommon: class lookup failed: %s", kImplInfo[idx].returnClassName);
      }
    }
  }

  const char *attr = property_getAttributes(prop);

  const char *dynamicMarker = strstr(attr, ",D");
  if (!dynamicMarker ||
      (dynamicMarker[2] != 0 && dynamicMarker[2] != ',' )) {
    GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: property %s isn't dynamic, attributes %s",
                   property_getName(prop), attr ? attr : "(nil)");
    return NULL;
  }

  const GTLRDynamicImpInfo *result = NULL;

  // Cycle over the list

  for (uint32_t idx = 0; idx < sizeof(kImplInfo)/sizeof(kImplInfo[0]); ++idx) {
    const char *attributePrefix = kImplInfo[idx].attributePrefix;
    if (strncmp(attr, attributePrefix, strlen(attributePrefix)) == 0) {
      result = &kImplInfo[idx];
      if (outReturnClass) *outReturnClass = result->returnClass;
      break;
    }
  }

  if (result == NULL) {
    GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: unexpected attributes %s for property %s",
                   attr ? attr : "(nil)", property_getName(prop));
    return NULL;
  }

  if (result->extractReturnClass && outReturnClass) {

    // add a null at the next quotation mark
    char *attrCopy = strdup(attr);
    char *classNameStart = attrCopy + 3;
    char *classNameEnd = strstr(classNameStart, "\"");
    if (classNameEnd) {
      *classNameEnd = '\0';

      // Lookup the return class
      *outReturnClass = objc_getClass(classNameStart);
      if (*outReturnClass == nil) {
        GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: did not find class with name \"%s\" "
                       @"for property \"%s\" with attributes \"%s\"",
                       classNameStart, property_getName(prop), attr);
      }
    } else {
      GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: Failed to find end of class name for "
                     @"property \"%s\" with attributes \"%s\"",
                     property_getName(prop), attr);
    }
    free(attrCopy);
  }

  return result;
}

// Helper to get the IMP for wiring up the getters.
// NOTE: Every argument passed in should be safe to capture in a block. Avoid
// passing something like selName instead of sel, because nothing says that
// pointer will be valid when it is finally used when the method IMP is invoked
// some time later.
static IMP GTLRRuntimeGetterIMP(SEL sel,
                                GTLRPropertyType propertyType,
                                NSString *jsonKey,
                                Class containedClass,
                                Class returnClass) {
  // Only used in DEBUG logging.
#pragma unused(sel)

  IMP resultIMP;
  switch (propertyType) {

#if !defined(__LP64__) || !__LP64__
    case GTLRPropertyTypeInt32: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        NSInteger result = num.integerValue;
        return result;
      });
      break;
    }

    case GTLRPropertyTypeUInt32: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        NSUInteger result = num.unsignedIntegerValue;
        return result;
      });
      break;
    }
#endif  // __LP64__

    case GTLRPropertyTypeLongLong: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        long long result = num.longLongValue;
        return result;
      });
      break;
    }

    case GTLRPropertyTypeULongLong: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        unsigned long long result = num.unsignedLongLongValue;
        return result;
      });
      break;
    }

    case GTLRPropertyTypeFloat: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        float result = num.floatValue;
        return result;
      });
      break;
    }

    case GTLRPropertyTypeDouble: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        double result = num.doubleValue;
        return result;
      });
      break;
    }

    case GTLRPropertyTypeBool: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        BOOL flag = num.boolValue;
        return flag;
      });
      break;
    }

    case GTLRPropertyTypeNSString: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSString *str = [obj JSONValueForKey:jsonKey];
        return str;
      });
      break;
    }

    case GTLRPropertyTypeGTLRDateTime: {
      resultIMP = imp_implementationWithBlock(^GTLRDateTime *(GTLRObject<GTLRRuntimeCommon> *obj) {
        // Return the cached object before creating on demand.
        GTLRDateTime *cachedDateTime = [obj cacheChildForKey:jsonKey];
        if (cachedDateTime != nil) {
          return cachedDateTime;
        }
        NSString *str = [obj JSONValueForKey:jsonKey];
        id cacheValue, resultValue;
        if (![str isKindOfClass:[NSNull class]]) {
          GTLRDateTime *dateTime = [GTLRDateTime dateTimeWithRFC3339String:str];

          cacheValue = dateTime;
          resultValue = dateTime;
        } else {
          cacheValue = nil;
          resultValue = [NSNull null];
        }
        [obj setCacheChild:cacheValue forKey:jsonKey];
        return resultValue;
      });
      break;
    }

    case GTLRPropertyTypeGTLRDuration: {
      resultIMP = imp_implementationWithBlock(^GTLRDuration *(GTLRObject<GTLRRuntimeCommon> *obj) {
        // Return the cached object before creating on demand.
        GTLRDuration *cachedDuration = [obj cacheChildForKey:jsonKey];
        if (cachedDuration != nil) {
          return cachedDuration;
        }
        NSString *str = [obj JSONValueForKey:jsonKey];
        id cacheValue, resultValue;
        if (![str isKindOfClass:[NSNull class]]) {
          GTLRDuration *duration = [GTLRDuration durationWithJSONString:str];

          cacheValue = duration;
          resultValue = duration;
        } else {
          cacheValue = nil;
          resultValue = [NSNull null];
        }
        [obj setCacheChild:cacheValue forKey:jsonKey];
        return resultValue;
      });
      break;
    }

    case GTLRPropertyTypeNSNumber: {
      resultIMP = imp_implementationWithBlock(^(id obj) {
        NSNumber *num = [obj JSONValueForKey:jsonKey];
        num = GTLR_EnsureNSNumber(num);
        return num;
      });
      break;
    }

    case GTLRPropertyTypeGTLRObject: {
      // Default return class to GTLRObject if it wasn't found.
      if (returnClass == Nil) {
        returnClass = [GTLRObject class];
      }
      resultIMP = imp_implementationWithBlock(^GTLRObject *(GTLRObject<GTLRRuntimeCommon> *obj) {
        // Return the cached object before creating on demand.
        GTLRObject *cachedObj = [obj cacheChildForKey:jsonKey];
        if (cachedObj != nil) {
          return cachedObj;
        }
        NSMutableDictionary *dict = [obj JSONValueForKey:jsonKey];
        if ([dict isKindOfClass:[NSMutableDictionary class]]) {
          id<GTLRObjectClassResolver>objectClassResolver = [obj objectClassResolver];
          GTLRObject *subObj = [GTLRObject objectForJSON:dict
                                            defaultClass:returnClass
                                     objectClassResolver:objectClassResolver];
          [obj setCacheChild:subObj forKey:jsonKey];
          return subObj;
        } else if ([dict isKindOfClass:[NSNull class]]) {
          [obj setCacheChild:nil forKey:jsonKey];
          return (GTLRObject*)[NSNull null];
        } else if (dict != nil) {
          // unexpected; probably got a string -- let the caller figure it out
          GTLR_DEBUG_LOG(@"GTLRObject: unexpected JSON: %@.%@ should be a dictionary, actually is a %@:\n%@",
                         NSStringFromClass([obj class]),
                         NSStringFromSelector(sel),
                         NSStringFromClass([dict class]), dict);
          return (GTLRObject *)dict;
        }
        return nil;
      });
      break;
    }

    case GTLRPropertyTypeNSArray: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj) {
        // Return the cached array before creating on demand.
        NSMutableArray *cachedArray = [obj cacheChildForKey:jsonKey];
        if (cachedArray != nil) {
          return cachedArray;
        }
        NSMutableArray *result = nil;
        NSArray *array = [obj JSONValueForKey:jsonKey];
        if (array != nil) {
          if ([array isKindOfClass:[NSArray class]]) {
            id<GTLRObjectClassResolver>objectClassResolver = [obj objectClassResolver];
            result = [GTLRRuntimeCommon objectFromJSON:array
                                          defaultClass:containedClass
                                   objectClassResolver:objectClassResolver
                                           isCacheable:NULL];
          } else {
#if DEBUG
            if (![array isKindOfClass:[NSNull class]]) {
              GTLR_DEBUG_LOG(@"GTLRObject: unexpected JSON: %@.%@ should be an array, actually is a %@:\n%@",
                             NSStringFromClass([obj class]),
                             NSStringFromSelector(sel),
                             NSStringFromClass([array class]), array);
            }
#endif
            result = (NSMutableArray *)array;
          }
        }
        [obj setCacheChild:result forKey:jsonKey];
        return result;
      });
      break;
    }

    case GTLRPropertyTypeNSObject: {
      resultIMP = imp_implementationWithBlock(^id(GTLRObject<GTLRRuntimeCommon> *obj) {
        // Return the cached object before creating on demand.
        id cachedObj = [obj cacheChildForKey:jsonKey];
        if (cachedObj != nil) {
          return cachedObj;
        }
        id jsonObj = [obj JSONValueForKey:jsonKey];
        if (jsonObj != nil) {
          BOOL shouldCache = NO;
          id<GTLRObjectClassResolver>objectClassResolver = [obj objectClassResolver];
          id result = [GTLRRuntimeCommon objectFromJSON:jsonObj
                                          defaultClass:nil
                                    objectClassResolver:objectClassResolver
                                           isCacheable:&shouldCache];

          [obj setCacheChild:(shouldCache ? result : nil)
                      forKey:jsonKey];
          return result;
        }
        return nil;
      });
      break;
    }
  }  // switch(propertyType)

  return resultIMP;
}

// Helper to get the IMP for wiring up the setters.
// NOTE: Every argument passed in should be safe to capture in a block. Avoid
// passing something like selName instead of sel, because nothing says that
// pointer will be valid when it is finally used when the method IMP is invoked
// some time later.
static IMP GTLRRuntimeSetterIMP(SEL sel,
                                GTLRPropertyType propertyType,
                                NSString *jsonKey,
                                Class containedClass,
                                Class returnClass) {
#pragma unused(sel, returnClass)
  IMP resultIMP;
  switch (propertyType) {

#if !defined(__LP64__) || !__LP64__
    case GTLRPropertyTypeInt32: {
      resultIMP = imp_implementationWithBlock(^(id obj, NSInteger val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeUInt32: {
      resultIMP = imp_implementationWithBlock(^(id obj, NSUInteger val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }
#endif  // __LP64__

    case GTLRPropertyTypeLongLong: {
      resultIMP = imp_implementationWithBlock(^(id obj, long long val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeULongLong: {
      resultIMP = imp_implementationWithBlock(^(id obj,
                                                unsigned long long val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeFloat: {
      resultIMP = imp_implementationWithBlock(^(id obj, float val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeDouble: {
      resultIMP = imp_implementationWithBlock(^(id obj, double val) {
        [obj setJSONValue:@(val) forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeBool: {
      resultIMP = imp_implementationWithBlock(^(id obj, BOOL val) {
        NSNumber *numValue = (NSNumber *)(val ? kCFBooleanTrue : kCFBooleanFalse);
        [obj setJSONValue:numValue forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeNSString: {
      resultIMP = imp_implementationWithBlock(^(id obj, NSString *val) {
        NSString *copiedStr = [val copy];
        [obj setJSONValue:copiedStr forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeGTLRDateTime: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj,
                                                GTLRDateTime *val) {
        id cacheValue, jsonValue;
        if (![val isKindOfClass:[NSNull class]]) {
          jsonValue = val.RFC3339String;
          cacheValue = val;
        } else {
          jsonValue = [NSNull null];
          cacheValue = nil;
        }

        [obj setJSONValue:jsonValue forKey:jsonKey];
        [obj setCacheChild:cacheValue forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeGTLRDuration: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj,
                                                GTLRDuration *val) {
        id cacheValue, jsonValue;
        if (![val isKindOfClass:[NSNull class]]) {
          jsonValue = val.jsonString;
          cacheValue = val;
        } else {
          jsonValue = [NSNull null];
          cacheValue = nil;
        }

        [obj setJSONValue:jsonValue forKey:jsonKey];
        [obj setCacheChild:cacheValue forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeNSNumber: {
      resultIMP = imp_implementationWithBlock(^(id obj, NSNumber *val) {
        [obj setJSONValue:val forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeGTLRObject: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj,
                                                GTLRObject *val) {
        id cacheValue, jsonValue;
        if (![val isKindOfClass:[NSNull class]]) {
          NSMutableDictionary *dict = [val JSON];
          if (dict == nil && val != nil) {
            // adding an empty object; it should have a JSON dictionary so it
            // can hold future assignments
            val.JSON = [NSMutableDictionary dictionary];
            jsonValue = val.JSON;
          } else {
            jsonValue = dict;
          }
          cacheValue = val;
        } else {
          jsonValue = [NSNull null];
          cacheValue = nil;
        }
        [obj setJSONValue:jsonValue forKey:jsonKey];
        [obj setCacheChild:cacheValue forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeNSArray: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj,
                                                NSMutableArray *val) {
        id json = [GTLRRuntimeCommon jsonFromAPIObject:val
                                         expectedClass:containedClass
                                           isCacheable:NULL];
        [obj setJSONValue:json forKey:jsonKey];
        [obj setCacheChild:val forKey:jsonKey];
      });
      break;
    }

    case GTLRPropertyTypeNSObject: {
      resultIMP = imp_implementationWithBlock(^(GTLRObject<GTLRRuntimeCommon> *obj,
                                                id val) {
        BOOL shouldCache = NO;
        id json = [GTLRRuntimeCommon jsonFromAPIObject:val
                                         expectedClass:Nil
                                           isCacheable:&shouldCache];
        [obj setJSONValue:json forKey:jsonKey];
        [obj setCacheChild:(shouldCache ? val : nil)
                     forKey:jsonKey];
      });
      break;
    }
  }  // switch(propertyType)

  return resultIMP;
}

#pragma mark Runtime - wiring point

+ (BOOL)resolveInstanceMethod:(SEL)sel onClass:(Class<GTLRRuntimeCommon>)onClass {
  // dynamic method resolution:
  // http://developer.apple.com/library/ios/#documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtDynamicResolution.html
  //
  // property runtimes:
  // http://developer.apple.com/library/ios/#documentation/Cocoa/Conceptual/ObjCRuntimeGuide/Articles/ocrtPropertyIntrospection.html

  const char *selName = sel_getName(sel);
  size_t selNameLen = strlen(selName);
  char lastChar = selName[selNameLen - 1];
  BOOL isSetter = (lastChar == ':');

  // look for a declared property matching this selector name exactly
  Class<GTLRRuntimeCommon> foundClass = nil;

  objc_property_t prop = PropertyForSel(onClass, sel, isSetter, &foundClass);
  if (prop == NULL || foundClass == nil) {
    return NO;  // No luck, out of here.
  }

  Class returnClass = nil;
  const GTLRDynamicImpInfo *implInfo = DynamicImpInfoForProperty(prop,
                                                                 &returnClass);
  if (implInfo == NULL) {
    GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: unexpected return type class %s for "
                   @"property \"%s\" of class \"%s\"",
                   returnClass ? class_getName(returnClass) : "<nil>",
                   property_getName(prop),
                   class_getName(onClass));
    return NO;  // Failed to find our impl info, out of here.
  }

  const char *propName = property_getName(prop);
  NSString *propStr = @(propName);

  // replace the property name with the proper JSON key if it's
  // special-cased with a map in the found class; otherwise, the property
  // name is the JSON key
  // NOTE: These caches that are built up could likely be dropped and do this
  // lookup on demand from the class tree. Most are checked once when a method
  // is first resolved, so eventually become wasted memory.
  NSDictionary *keyMap =
    [[foundClass ancestorClass] propertyToJSONKeyMapForClass:foundClass];
  NSString *jsonKey = [keyMap objectForKey:propStr];
  if (jsonKey == nil) {
    jsonKey = propStr;
  }

  // For arrays we need to look up what the contained class is.
  Class containedClass = nil;
  if (implInfo->propertyType == GTLRPropertyTypeNSArray) {
    NSDictionary *classMap =
      [[foundClass ancestorClass] arrayPropertyToClassMapForClass:foundClass];
    containedClass = [classMap objectForKey:jsonKey];
    if (containedClass == Nil) {
      GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: expected array item class for "
                     @"property \"%s\" of class \"%s\"",
                     property_getName(prop), class_getName(foundClass));
    }
  }

  // Wire in the method.
  IMP imp;
  const char *encoding;
  if (isSetter) {
    imp = GTLRRuntimeSetterIMP(sel, implInfo->propertyType,
                               jsonKey, containedClass, returnClass);
    encoding = implInfo->setterEncoding;
  } else {
    imp = GTLRRuntimeGetterIMP(sel, implInfo->propertyType,
                               jsonKey, containedClass, returnClass);
    encoding = implInfo->getterEncoding;
  }
  if (class_addMethod(foundClass, sel, imp, encoding)) {
    return YES;
  }
  // Not much we can do if this fails, but leave a breadcumb in the log.
  GTLR_DEBUG_LOG(@"GTLRRuntimeCommon: Failed to wire %@ on %@ (encoding: %s).",
                 NSStringFromSelector(sel),
                 NSStringFromClass(foundClass),
                 encoding);
  return NO;
}

@end
