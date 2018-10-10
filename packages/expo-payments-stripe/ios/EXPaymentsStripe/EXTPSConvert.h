#import <Foundation/Foundation.h>
#import <Stripe/Stripe.h>

#define EX_ENUM_CONVERTER_DEF(rType) + (rType)rType:(id)json;

@interface EXTPSConvert : NSObject
+ (NSString *)STPBankAccountHolderTypeToString:(STPBankAccountHolderType)type;
+ (NSString *)STPBankAccountStatusToString:(STPBankAccountStatus)status;
+ (STPBankAccountHolderType)holderType:(id)json;
+ (STPBankAccountStatus)statusType:(id)json;
+ (UIColor *)UIColor:(id)json;
+ (NSArray *)NSArray:(id)json;
+ (NSDictionary *)NSDictionary:(id)json;
+ (NSString *)NSString:(id)json;
+ (NSNumber *)NSNumber:(id)json;
+ (NSArray<NSString *> *)NSStringArray:(id)json;
+ (NSArray *)EXConvertArrayValue:(SEL) type value:(id) json;
EX_ENUM_CONVERTER_DEF(UIKeyboardAppearance)
@end

#define EX_ENUM_CONVERTER(rType, map, defaultValue, getter)                \
+ (rType)rType:(id)json                                                    \
{                                                                          \
  NSNumber *defaultVal = @(defaultValue);                                  \
  NSDictionary *mapping = map;                                             \
  if (!json) {                                                             \
    return (rType)defaultValue;                                            \
  }                                                                        \
  NSArray *allValues = mapping.allValues;                                  \
  if ([allValues containsObject:json] || [json isEqual: defaultVal]) {     \
    return (rType)[json getter];                                           \
  }                                                                        \
  return (rType)defaultValue;                                              \
}

#define EX_JSON_ARRAY_CONVERTER_NAMED(type, name) + (NSArray *)name##Array:(id)json { return json; }
#define EX_JSON_ARRAY_CONVERTER(type) EX_JSON_ARRAY_CONVERTER_NAMED(type, type)

/*/**
 * This macro is used for creating explicitly-named converter functions
 * for typed arrays.
 */
#define EX_ARRAY_CONVERTER_NAMED(type, name)          \
+ (NSArray<type *> *)name##Array:(id)json EX_DYNAMIC  \
{                                                     \
return EXConvertArrayValue(@selector(name:), json);   \
}

/**
 * This macro is used for creating converter functions for typed arrays.
 * RCT_ARRAY_CONVERTER_NAMED may be used when type contains characters
 * which are disallowed in selector names.
 */
#define EX_ARRAY_CONVERTER(type) EX_ARRAY_CONVERTER_NAMED(type, type)

