#import <EXPaymentsStripe/EXTPSConvert.h>
#define TO_DOUBLE(x) ([((NSNumber *)x) doubleValue])
#define TO_UNSIGNED_INTEGER(x) ([((NSNumber *)x) unsignedIntegerValue]);

@implementation EXTPSConvert

+ (NSString *)STPBankAccountHolderTypeToString:(STPBankAccountHolderType)type {
  NSString *string = nil;
  switch (type) {
      case STPBankAccountHolderTypeCompany: {
        string = @"company";
      }
      break;
      case STPBankAccountHolderTypeIndividual:
    default: {
      string = @"individual";
    }
      break;
  }
  return string;
}

+ (NSString *)STPBankAccountStatusToString:(STPBankAccountStatus)status {
  NSString *string = nil;
  switch (status) {
      case STPBankAccountStatusValidated: {
        string = @"validated";
      }
      break;
      case STPBankAccountStatusVerified: {
        string = @"verified";
      }
      break;
      case STPBankAccountStatusErrored: {
        string = @"errored";
      }
      break;
      case STPBankAccountStatusNew:
    default: {
      string = @"new";
    }
      break;
  }
  return string;
}

+ (STPBankAccountHolderType)holderType:(id)json
{
  NSDictionary *mapping = @{
     @"individual": @(STPBankAccountHolderTypeIndividual),
     @"company": @(STPBankAccountHolderTypeCompany),
  };
  
  if ([json isEqual:@"individual"]) {
    return (STPBankAccountHolderType)mapping[@"individual"];
  }
  return (STPBankAccountHolderType)mapping[@"company"];
}

+ (STPBankAccountStatus)statusType:(id)json
{
  NSDictionary *mapping = @{
    @"new": @(STPBankAccountStatusNew),
    @"validated": @(STPBankAccountStatusValidated),
    @"verified": @(STPBankAccountStatusVerified),
    @"errored": @(STPBankAccountStatusErrored)
  };
  
  if ([mapping valueForKey:json]) {
    return (STPBankAccountStatus)[mapping valueForKey:json];
  }
  return STPBankAccountStatusNew;
}

+ (UIColor *)UIColor:(id)json
{
  if (!json) {
    return nil;
  }
  if ([json isKindOfClass:[NSArray class]]) {
    NSArray *components = (NSArray<NSNumber *> *)json;
    CGFloat alpha = components.count > 3 ? TO_DOUBLE(components[3]) : 1.0;
    return [UIColor colorWithRed:TO_DOUBLE(components[0])
                           green:TO_DOUBLE(components[1])
                            blue:TO_DOUBLE(components[2])
                           alpha:alpha];
  } else if ([json isKindOfClass:[NSNumber class]]) {
    NSUInteger argb = TO_UNSIGNED_INTEGER(json);
    CGFloat a = ((argb >> 24) & 0xFF) / 255.0;
    CGFloat r = ((argb >> 16) & 0xFF) / 255.0;
    CGFloat g = ((argb >> 8) & 0xFF) / 255.0;
    CGFloat b = (argb & 0xFF) / 255.0;
    return [UIColor colorWithRed:r green:g blue:b alpha:a];
  } else {
    NSLog(@"a UIColor. Did you forget to call processColor() on the JS side?\n");
    return nil;
  }
}

+ (NSArray *)EXConvertArrayValue:(SEL) type value:(id) json
{
  __block BOOL copy = NO;
  __block NSArray *values = json = [EXTPSConvert NSArray:json];
  [json enumerateObjectsUsingBlock:^(id jsonValue, NSUInteger idx, __unused BOOL *stop) {
    id value = [EXTPSConvert performSelector:type withObject:jsonValue];
    if (copy) {
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
    } else if (value != jsonValue) {
      // Converted value is different, so we'll need to copy the array
      values = [[NSMutableArray alloc] initWithCapacity:values.count];
      for (NSUInteger i = 0; i < idx; i++) {
        [(NSMutableArray *)values addObject:json[i]];
      }
      if (value) {
        [(NSMutableArray *)values addObject:value];
      }
      copy = YES;
    }
  }];
  return values;
}

EX_ENUM_CONVERTER(UIKeyboardAppearance, (@{
                                           @"default": @(UIKeyboardAppearanceDefault),
                                           @"light": @(UIKeyboardAppearanceLight),
                                           @"dark": @(UIKeyboardAppearanceDark),
                                           }), UIKeyboardAppearanceDefault, integerValue)

EX_JSON_ARRAY_CONVERTER(NSArray)
EX_JSON_ARRAY_CONVERTER(NSString)
EX_JSON_ARRAY_CONVERTER_NAMED(NSArray<NSString *>, NSStringArray)
EX_JSON_ARRAY_CONVERTER(NSDictionary)
EX_JSON_ARRAY_CONVERTER(NSNumber)

@end


