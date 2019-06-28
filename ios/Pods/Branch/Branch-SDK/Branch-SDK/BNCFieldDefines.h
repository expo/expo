//
//  BNCFieldDefines.h
//  Branch-TestBed
//
//  Created by edward on 8/17/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#if defined(addString) // --------------------------------------------------------------------------

    // Already defined so undefine them:

    #undef addString
    #undef addDate
    #undef addDouble
    #undef addBoolean
    #undef addDecimal
    #undef addNumber
    #undef addInteger
    #undef addStringifiedDictionary
    #undef addStringArray
    #undef addDictionary
    #undef BNCFieldDefinesObjectFromDictionary
    #undef BNCFieldDefinesDictionaryFromSelf

#elif defined(BNCFieldDefinesObjectFromDictionary) // ----------------------------------------------

    #define addString(field, name) { \
        NSString *string = dictionary[@#name]; \
        if ([string isKindOfClass:[NSString class]]) { \
            object.field = string; \
        } \
    }

    #define addDate(field, name) { \
        NSNumber *number = dictionary[@#name]; \
        if ([number isKindOfClass:[NSNumber class]] || \
            [number isKindOfClass:[NSString class]]) { \
            NSTimeInterval t = [number doubleValue]; \
            if (t) object.field = [NSDate dateWithTimeIntervalSince1970:t/1000.0]; \
        } \
    }

    #define addDouble(field, name) { \
        NSNumber *number = dictionary[@#name]; \
        if ([number isKindOfClass:[NSNumber class]] || \
            [number isKindOfClass:[NSString class]]) { \
            object.field = [number doubleValue]; \
        } \
    }

    #define addBoolean(field, name) { \
        NSNumber *number = dictionary[@#name]; \
        if ([number isKindOfClass:[NSNumber class]] || \
            [number isKindOfClass:[NSString class]]) { \
            object.field = [number boolValue]; \
        } \
    }

    #define addDecimal(field, name) { \
        NSString *string = dictionary[@#name]; \
        if ([string isKindOfClass:[NSNumber class]]) \
            string = [string description]; \
        if ([string isKindOfClass:[NSString class]]) { \
            object.field = [NSDecimalNumber decimalNumberWithString:string]; \
        } \
    }

    #define addNumber(field, name) { \
        NSNumber *number = dictionary[@#name]; \
        if ([number isKindOfClass:[NSString class]]) \
            number = [number doubleValue]; \
        if ([number isKindOfClass:[NSNumber class]]) { \
            object.field = number; \
        } \
    }

    #define addInteger(field, name) { \
        NSNumber *number = dictionary[@#name]; \
        if ([number isKindOfClass:[NSNumber class]] || \
            [number isKindOfClass:[NSString class]]) { \
            object.field = [number integerValue]; \
        } \
    }

    #define addStringifiedDictionary(field, name) { \
        NSString *string = dictionary[@#name]; \
        if ([string isKindOfClass:[NSString class]]) { \
            NSDictionary *d = [BNCEncodingUtils decodeJsonStringToDictionary:string]; \
            object.field = [NSMutableDictionary dictionaryWithDictionary:d]; \
        } \
    }

    #define addStringArray(field, name) { \
        NSArray *a = dictionary[@#name]; \
        if ([a isKindOfClass:[NSArray class]]) { \
            NSMutableArray *newArray = [NSMutableArray array]; \
            for (NSString *s in a) { \
                if ([s isKindOfClass:[NSString class]]) { \
                    [newArray addObject:s]; \
                } \
            } \
            object.field = newArray; \
        } else if ([a isKindOfClass:[NSString class]]) { \
            object.field = [NSMutableArray arrayWithObject:a]; \
        } else { \
            object.field = (id) [NSMutableArray new]; \
        } \
    }

    #define addDictionary(field, name) { \
        NSDictionary *d = dictionary[@#name]; \
        if ([d isKindOfClass:[NSDictionary class]]) { \
            object.field = [NSMutableDictionary dictionaryWithDictionary:d]; \
        } \
    }

#elif defined(BNCFieldDefinesDictionaryFromSelf) // ----------------------------------------------

    #define addString(field, name) { \
        if (self.field.length) { \
            dictionary[@#name] = self.field; \
        } \
    }

    #define addDate(field, name) { \
        if (self.field) { \
            NSTimeInterval t = self.field.timeIntervalSince1970; \
            dictionary[@#name] = [NSNumber numberWithLongLong:(long long)(t*1000.0)]; \
        } \
    }

    #define addDouble(field, name) { \
        if (self.field != 0.0) { \
            dictionary[@#name] = [NSNumber numberWithDouble:self.field]; \
        } \
    }

    #define addBoolean(field, name) { \
        if (self.field) { \
            dictionary[@#name] = CFBridgingRelease(kCFBooleanTrue); \
        } \
    }

    #define addDecimal(field, name) { \
        if (self.field) { \
            dictionary[@#name] = self.field; \
        } \
    }

    #define addNumber(field, name) { \
        if (self.field != nil) { \
            dictionary[@#name] = self.field; \
        } \
    }

    #define addInteger(field, name) { \
        if (self.field != 0) { \
            dictionary[@#name] = [NSNumber numberWithInteger:self.field]; \
        } \
    }

    #define addStringifiedDictionary(field, name) { \
        if (self.field.count) { \
            NSString *string = [BNCEncodingUtils encodeDictionaryToJsonString:self.field]; \
            dictionary[@#name] = string; \
        } \
    }

    #define addStringArray(field, name) { \
        if (self.field.count) { \
            dictionary[@#name] = self.field; \
        } \
    }

    #define addDictionary(field, name) { \
        if (self.field.count) { \
            dictionary[@#name] = self.field; \
        } \
    }

#else

//#error "Define either 'BNCFieldDefinesDictionaryFromObject' or 'BNCFieldDefinesObjectFromDictionary'.

#endif
