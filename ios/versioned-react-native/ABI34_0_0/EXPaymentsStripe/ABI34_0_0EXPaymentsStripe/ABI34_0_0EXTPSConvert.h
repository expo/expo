#import <Foundation/Foundation.h>
#import <Stripe/Stripe.h>

#define ABI34_0_0EX_ENUM_CONVERTER_DEF(rType) + (rType)rType:(id)json;

@interface ABI34_0_0EXTPSConvert : NSObject
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
+ (NSArray *)ABI34_0_0EXConvertArrayValue:(SEL) type value:(id) json;
ABI34_0_0EX_ENUM_CONVERTER_DEF(UIKeyboardAppearance)
@end

#define ABI34_0_0EX_ENUM_CONVERTER(rType, map, defaultValue, getter)                \
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

#define ABI34_0_0EX_JSON_ARRAY_CONVERTER_NAMED(type, name) + (NSArray *)name##Array:(id)json { return json; }
#define ABI34_0_0EX_JSON_ARRAY_CONVERTER(type) ABI34_0_0EX_JSON_ARRAY_CONVERTER_NAMED(type, type)

/*/**
 * This macro is used for creating explicitly-named converter functions
 * for typed arrays.
 */
#define ABI34_0_0EX_ARRAY_CONVERTER_NAMED(type, name)          \
+ (NSArray<type *> *)name##Array:(id)json ABI34_0_0EX_DYNAMIC  \
{                                                     \
return ABI34_0_0EXConvertArrayValue(@selector(name:), json);   \
}

/**
 * This macro is used for creating converter functions for typed arrays.
 * ABI34_0_0RCT_ARRAY_CONVERTER_NAMED may be used when type contains characters
 * which are disallowed in selector names.
 */
#define ABI34_0_0EX_ARRAY_CONVERTER(type) ABI34_0_0EX_ARRAY_CONVERTER_NAMED(type, type)

