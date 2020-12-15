/*! @file OIDFieldMapping.m
    @brief AppAuth iOS SDK
    @copyright
        Copyright 2015 Google Inc. All Rights Reserved.
    @copydetails
        Licensed under the Apache License, Version 2.0 (the "License");
        you may not use this file except in compliance with the License.
        You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

        Unless required by applicable law or agreed to in writing, software
        distributed under the License is distributed on an "AS IS" BASIS,
        WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
        See the License for the specific language governing permissions and
        limitations under the License.
 */

#import "OIDFieldMapping.h"

#import "OIDDefines.h"

@implementation OIDFieldMapping

- (nonnull instancetype)init
    OID_UNAVAILABLE_USE_INITIALIZER(@selector(initWithName:type:conversion:))

- (instancetype)initWithName:(NSString *)name
                                 type:(Class)type {
  return [self initWithName:name type:type conversion:nil];
}

- (instancetype)initWithName:(NSString *)name
                                 type:(Class)type
                           conversion:(nullable OIDFieldMappingConversionFunction)conversion {
  self = [super init];
  if (self) {
    _name = [name copy];
    _expectedType = type;
    _conversion = conversion;
  }
  return self;
}

+ (NSDictionary<NSString *, NSObject<NSCopying> *> *)remainingParametersWithMap:
    (NSDictionary<NSString *, OIDFieldMapping *> *)map
    parameters:(NSDictionary<NSString *, NSObject<NSCopying> *> *)parameters
      instance:(id)instance {
  NSMutableDictionary *additionalParameters = [NSMutableDictionary dictionary];
  for (NSString *key in parameters) {
    NSObject<NSCopying> *value = [parameters[key] copy];
    OIDFieldMapping *mapping = map[key];
    // If the field doesn't appear in the mapping, we add it to the additional parameters
    // dictionary.
    if (!mapping) {
      additionalParameters[key] = value;
      continue;
    }
    // If the field mapping specifies a conversion function, apply the conversion to the value.
    if (mapping.conversion) {
      value = mapping.conversion(value);
    }
    // Check the type of the value and make sure it matches the type we expected. If it doesn't we
    // add the value to the additional parameters dictionary but don't assign the instance variable.
    if (![value isKindOfClass:mapping.expectedType]) {
      additionalParameters[key] = value;
      continue;
    }
    // Assign the instance variable.
    [instance setValue:value forKey:mapping.name];
  }
  return additionalParameters;
}

+ (void)encodeWithCoder:(NSCoder *)aCoder
                    map:(NSDictionary<NSString *, OIDFieldMapping *> *)map
               instance:(id)instance {
  for (NSString *key in map) {
    id value = [instance valueForKey:map[key].name];
    [aCoder encodeObject:value forKey:key];
  }
}

+ (void)decodeWithCoder:(NSCoder *)aCoder
                    map:(NSDictionary<NSString *, OIDFieldMapping *> *)map
               instance:(id)instance {
  for (NSString *key in map) {
    OIDFieldMapping *mapping = map[key];
    id value = [aCoder decodeObjectOfClass:mapping.expectedType forKey:key];
    [instance setValue:value forKey:mapping.name];
  }
}

+ (NSSet *)JSONTypes {
  return [NSSet setWithArray:@[
    [NSDictionary class],
    [NSArray class],
    [NSString class],
    [NSNumber class]
  ]];
}

+ (OIDFieldMappingConversionFunction)URLConversion {
  return ^id _Nullable(NSObject *_Nullable value) {
    if ([value isKindOfClass:[NSString class]]) {
      return [NSURL URLWithString:(NSString *)value];
    }
    return value;
  };
}

+ (OIDFieldMappingConversionFunction)dateSinceNowConversion {
  return ^id _Nullable(NSObject *_Nullable value) {
    if (![value isKindOfClass:[NSNumber class]]) {
      return value;
    }
    NSNumber *valueAsNumber = (NSNumber *)value;
    return [NSDate dateWithTimeIntervalSinceNow:[valueAsNumber longLongValue]];
  };
}

+ (OIDFieldMappingConversionFunction)dateEpochConversion {
  return ^id _Nullable(NSObject *_Nullable value) {
    if (![value isKindOfClass:[NSNumber class]]) {
      return value;
    }
    NSNumber *valueAsNumber = (NSNumber *) value;
    return [NSDate dateWithTimeIntervalSince1970:[valueAsNumber longLongValue]];
  };
}

@end
