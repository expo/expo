//
//  BNCEncodingUtils.m
//  Branch
//
//  Created by Graham Mueller on 3/31/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCEncodingUtils.h"
#import "BNCPreferenceHelper.h"
#import "BNCLog.h"
#import <CommonCrypto/CommonDigest.h>

#pragma mark BNCWireFormat

NSDate* BNCDateFromWireFormat(id object) {
    NSDate *date = nil;
    if ([object respondsToSelector:@selector(doubleValue)]) {
        NSTimeInterval t = [object doubleValue];
        date = [NSDate dateWithTimeIntervalSince1970:t/1000.0];
    }
    return date;
}

NSNumber* BNCWireFormatFromDate(NSDate *date) {
    NSNumber *number = nil;
    NSTimeInterval t = [date timeIntervalSince1970];
    if (date && t != 0.0 ) {
        number = [NSNumber numberWithLongLong:(long long)(t*1000.0)];
    }
    return number;
}

NSNumber* BNCWireFormatFromBool(BOOL b) {
    return (b) ? (__bridge NSNumber*) kCFBooleanTrue : nil;
}

NSString* BNCStringFromWireFormat(id object) {
    if ([object isKindOfClass:NSString.class])
        return object;
    else
    if ([object respondsToSelector:@selector(stringValue)])
        return [object stringValue];
    else
    if ([object respondsToSelector:@selector(description)])
        return [object description];
    return nil;
}

NSString* BNCWireFormatFromString(NSString *string) {
    return string;
}

#pragma mark - BNCKeyValue

@implementation BNCKeyValue

+ (BNCKeyValue*) key:(NSString*)key value:(NSString*)value {
    BNCKeyValue *kv = [[BNCKeyValue alloc] init];
    kv.key = key;
    kv.value = value;
    return kv;
}

- (NSString*) description {
    return [NSString stringWithFormat:@"<%@, %@>", self.key, self.value];
}

- (BOOL) isEqual:(id)rawObject {
    BNCKeyValue *object = rawObject;
    return
        [object isKindOfClass:[BNCKeyValue class]] &&
        [self.key isEqualToString:object.key] &&
        [self.value isEqualToString:object.value]
        ;
}

@end

#pragma mark - BNCEncodingUtils

@implementation BNCEncodingUtils

#pragma mark - Base 64 Encoding

+ (NSString *)base64EncodeStringToString:(NSString *)strData {
    return [self base64EncodeData:[strData dataUsingEncoding:NSUTF8StringEncoding]];
}

+ (NSString *)base64DecodeStringToString:(NSString *)strData {
    NSData* data =[BNCEncodingUtils base64DecodeString:strData];
    if (data == nil) {
        return nil;
    }
    return [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
}

+ (NSString *)base64EncodeData:(NSData *)data {
    if (data) return [data base64EncodedStringWithOptions:0];
    return @"";
}

+ (NSData *)base64DecodeString:(NSString *)strBase64 {
    if (strBase64) return [[NSData alloc] initWithBase64EncodedString:strBase64 options:0];
    return nil;
}

#pragma mark - MD5 methods

+ (NSString *)md5Encode:(NSString *)input {
    if (!input) {
        return @"";
    }

    const char *cStr = [input UTF8String];
    unsigned char digest[CC_MD5_DIGEST_LENGTH];
    CC_MD5(cStr, (CC_LONG)strlen(cStr), digest);
    
    NSMutableString *output = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
    
    for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) {
        [output appendFormat:@"%02x", digest[i]];
    }

    return  output;
}


#pragma mark - Param Encoding methods

+ (NSString *)iso8601StringFromDate:(NSDate *)date {
    static NSDateFormatter *dateFormatter;
    static dispatch_once_t onceToken;
    
    dispatch_once(&onceToken, ^{
        dateFormatter = [[NSDateFormatter alloc] init];
        [dateFormatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]]; // POSIX to avoid weird issues
        [dateFormatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ssZZZZZ"];
    });
    
    return [dateFormatter stringFromDate:date];
}

+ (NSString *)sanitizedStringFromString:(NSString *)dirtyString {
    NSString *dirtyCopy = [dirtyString copy]; // dirtyString seems to get dealloc'ed sometimes. Make a copy.
    NSString *cleanString = [[[[dirtyCopy stringByReplacingOccurrencesOfString:@"\"" withString:@"\\\""]
                                          stringByReplacingOccurrencesOfString:@"\n" withString:@"\\n"]
                                          stringByReplacingOccurrencesOfString:@"’" withString:@"'"]
                                          stringByReplacingOccurrencesOfString:@"\r" withString:@"\\r"];
    return cleanString;
}

+ (NSData *)encodeDictionaryToJsonData:(NSDictionary *)dictionary {
    NSString *jsonString = [BNCEncodingUtils encodeDictionaryToJsonString:dictionary];
    NSUInteger length = [jsonString lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
    return [NSData dataWithBytes:[jsonString UTF8String] length:length];
}

+ (NSString *)encodeDictionaryToJsonString:(NSDictionary *)dictionary {
    NSMutableString *encodedDictionary = [[NSMutableString alloc] initWithString:@"{"];
    for (NSString *key in dictionary) {
        NSString *value = nil;
        BOOL string = YES;
        
        id obj = dictionary[key];
        if ([obj isKindOfClass:[NSString class]]) {
            value = [BNCEncodingUtils sanitizedStringFromString:obj];
        }
        else if ([obj isKindOfClass:[NSURL class]]) {
            value = [obj absoluteString];
        }
        else if ([obj isKindOfClass:[NSDate class]]) {
            value = [BNCEncodingUtils iso8601StringFromDate:obj];
        }
        else if ([obj isKindOfClass:[NSArray class]]) {
            value = [BNCEncodingUtils encodeArrayToJsonString:obj];
            string = NO;
        }
        else if ([obj isKindOfClass:[NSDictionary class]] || [obj isKindOfClass:[NSMutableDictionary class]]) {
            value = [BNCEncodingUtils encodeDictionaryToJsonString:obj];
            string = NO;
        }
        else if ([obj isKindOfClass:[NSNumber class]]) {
            string = NO;
            if (obj == (id)kCFBooleanFalse)
                value = @"false";
            else
            if (obj == (id)kCFBooleanTrue)
                value = @"true";
            else
                value = [obj stringValue];
        }
        else if ([obj isKindOfClass:[NSNull class]]) {
            value = @"null";
            string = NO;
        }
        else {
            // If this type is not a known type, don't attempt to encode it.
            BNCLogError(@"Cannot encode value for key %@. The value is not an accepted type.", key);
            continue;
        }
        
        [encodedDictionary appendFormat:@"\"%@\":", [BNCEncodingUtils sanitizedStringFromString:key]];
        
        // If this is a "string" object, wrap it in quotes
        if (string) {
            [encodedDictionary appendFormat:@"\"%@\",", value];
        }
        // Otherwise, just add the raw value after the colon
        else {
            [encodedDictionary appendFormat:@"%@,", value];
        }
    }
    
    if (encodedDictionary.length > 1) {
        [encodedDictionary deleteCharactersInRange:NSMakeRange([encodedDictionary length] - 1, 1)];
    }

    [encodedDictionary appendString:@"}"];

    BNCLogDebugSDK(@"Encoded dictionary: %@.", encodedDictionary);
    return encodedDictionary;
}

+ (NSString *)encodeArrayToJsonString:(NSArray *)array {
    // Empty array
    if (![array count]) {
        return @"[]";
    }

    NSMutableString *encodedArray = [[NSMutableString alloc] initWithString:@"["];
    for (id obj in array) {
        NSString *value = nil;
        BOOL string = YES;
        
        if ([obj isKindOfClass:[NSString class]]) {
            value = [BNCEncodingUtils sanitizedStringFromString:obj];
        }
        else if ([obj isKindOfClass:[NSURL class]]) {
            value = [obj absoluteString];
        }
        else if ([obj isKindOfClass:[NSDate class]]) {
            value = [BNCEncodingUtils iso8601StringFromDate:obj];
        }
        else if ([obj isKindOfClass:[NSArray class]]) {
            value = [BNCEncodingUtils encodeArrayToJsonString:obj];
            string = NO;
        }
        else if ([obj isKindOfClass:[NSDictionary class]] || [obj isKindOfClass:[NSMutableDictionary class]]) {
            value = [BNCEncodingUtils encodeDictionaryToJsonString:obj];
            string = NO;
        }
        else if ([obj isKindOfClass:[NSNumber class]]) {
            value = [obj stringValue];
            string = NO;
        }
        else if ([obj isKindOfClass:[NSNull class]]) {
            value = @"null";
            string = NO;
        }
        else {
            // If this type is not a known type, don't attempt to encode it.
            BNCLogError(@"Cannot encode value %@. The value is not an accepted type.", obj);
            continue;
        }
        
        // If this is a "string" object, wrap it in quotes
        if (string) {
            [encodedArray appendFormat:@"\"%@\",", value];
        }
        // Otherwise, just add the raw value after the colon
        else {
            [encodedArray appendFormat:@"%@,", value];
        }
    }
    
    // Delete the trailing comma
    [encodedArray deleteCharactersInRange:NSMakeRange([encodedArray length] - 1, 1)];
    [encodedArray appendString:@"]"];
    
    BNCLogDebugSDK(@"Encoded array: %@.", encodedArray);
    return encodedArray;
}

+ (NSString *)urlEncodedString:(NSString *)string {
    NSMutableCharacterSet *charSet = [[NSCharacterSet URLQueryAllowedCharacterSet] mutableCopy];
    [charSet removeCharactersInString:@"!*'\"();:@&=+$,/?%#[]% "];
    return [string stringByAddingPercentEncodingWithAllowedCharacters:charSet];
}

+ (NSString *)encodeDictionaryToQueryString:(NSDictionary *)dictionary {
    NSMutableString *queryString = [[NSMutableString alloc] initWithString:@"?"];

    for (NSString *key in [dictionary allKeys]) {
        // No empty keys, please.
        if (key.length) {
            id obj = dictionary[key];
            NSString *value;
            
            if ([obj isKindOfClass:[NSString class]]) {
                value = [BNCEncodingUtils urlEncodedString:obj];
            }
            else if ([obj isKindOfClass:[NSURL class]]) {
                value = [BNCEncodingUtils urlEncodedString:[obj absoluteString]];
            }
            else if ([obj isKindOfClass:[NSDate class]]) {
                value = [BNCEncodingUtils iso8601StringFromDate:obj];
            }
            else if ([obj isKindOfClass:[NSNumber class]]) {
                value = [obj stringValue];
            }
            else {
                // If this type is not a known type, don't attempt to encode it.
                BNCLogError(@"Cannot encode value %@. The value is not an accepted type.", obj);
                continue;
            }
            
            [queryString appendFormat:@"%@=%@&", [BNCEncodingUtils urlEncodedString:key], value];
        }
    }

    // Delete last character (either trailing & or ? if no params present)
    [queryString deleteCharactersInRange:NSMakeRange(queryString.length - 1, 1)];
    
    return queryString;
}

+ (NSString*) stringByPercentDecodingString:(NSString *)string {
    return [string stringByRemovingPercentEncoding];
}

+ (NSString*) stringByPercentEncodingStringForQuery:(NSString *)string {
    return [string stringByAddingPercentEncodingWithAllowedCharacters:
                [NSCharacterSet URLQueryAllowedCharacterSet]];
}

#pragma mark - Param Decoding Methods

+ (NSDictionary *)decodeJsonDataToDictionary:(NSData *)jsonData {
    NSString *jsonString = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    
    return [BNCEncodingUtils decodeJsonStringToDictionary:jsonString];
}

+ (NSDictionary *)decodeJsonStringToDictionary:(NSString *)jsonString {
    // Just a basic decode, easy enough
    NSData *tempData = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
    if (!tempData) {
        return @{};
    }

    NSDictionary *plainDecodedDictionary = [NSJSONSerialization JSONObjectWithData:tempData options:NSJSONReadingMutableContainers error:nil];
    if (plainDecodedDictionary) {
        return plainDecodedDictionary;
    }

    // If the first decode failed, it could be because the data was encoded. Try decoding first.
    NSString *decodedVersion = [BNCEncodingUtils base64DecodeStringToString:jsonString];
    tempData = [decodedVersion dataUsingEncoding:NSUTF8StringEncoding];
    if (!tempData) {
        return @{};
    }

    NSDictionary *base64DecodedDictionary = [NSJSONSerialization JSONObjectWithData:tempData options:NSJSONReadingMutableContainers error:nil];
    if (base64DecodedDictionary) {
        return base64DecodedDictionary;
    }

    // Apparently this data was not parsible into a dictionary, so we'll just return an empty one
    return @{};
}

+ (NSDictionary *)decodeQueryStringToDictionary:(NSString *)queryString {
    NSArray *pairs = [queryString componentsSeparatedByString:@"&"];
    NSMutableDictionary *params = [[NSMutableDictionary alloc] init];

    for (NSString *pair in pairs) {
        NSArray *kv = [pair componentsSeparatedByString:@"="];
        if (kv.count > 1) { // If this key has a value (so, not foo&bar=...)
            NSString *key = kv[0];
            NSString *val;
            
            //Pre iOS 7, stringByReplacingPercentEscapesUsingEncoding was deprecated in iOS 9
            if (NSFoundationVersionNumber < NSFoundationVersionNumber_iOS_7_0) {
                #pragma clang diagnostic push
                #pragma clang diagnostic ignored "-Wdeprecated-declarations"
                val = [kv[1] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
                #pragma clang diagnostic pop

            } else { //iOS 7 and later
                val = [kv[1] stringByRemovingPercentEncoding]; // uses the default UTF-8 encoding, introduced in iOS 7
            }
            
            // Don't add empty items
            if (val.length) {
                params[key] = val;
            }
        }
    }

    return params;
}

#pragma mark - Hex Strings

+ (NSString *) hexStringFromData:(NSData*)data {

    NSUInteger bytesCount = data.length;
    if (bytesCount <= 0) return @"";

    const char *hexChars = "0123456789ABCDEF";
    const char *dataBuffer = data.bytes;
    char *chars = malloc(sizeof(char) * (bytesCount * 2 + 1));
    if (!chars) return @"";
    char *s = chars;
    for (unsigned i = 0; i < bytesCount; ++i) {
        *s++ = hexChars[((*dataBuffer & 0xF0) >> 4)];
        *s++ = hexChars[(*dataBuffer & 0x0F)];
        dataBuffer++;
    }
    *s = '\0';

    NSString *hexString = [NSString stringWithUTF8String:chars];
    if (chars) free(chars);
    return hexString;
}

+ (NSData *) dataFromHexString:(NSString*)string {
    if (!string) return nil;

    NSData *data = nil;
    NSData *inputData = [string dataUsingEncoding:NSUTF8StringEncoding];

    size_t length = (inputData.length+1)/2;
    uint8_t *bytes = malloc(length);
    uint8_t *b = bytes;
    if (!bytes) goto exit;

    int highValue = -1;
    const uint8_t *p = (const uint8_t*) [inputData bytes];
    for (NSUInteger i = 0; i < inputData.length; ++i) {
        int value = -1;
        if (*p >= '0' && *p <= '9')
            value = *p - '0';
        else
        if (*p >= 'A' && *p <= 'F')
            value = *p - 'A' + 10;
        else
        if (*p >= 'a' && *p <= 'f')
            value = *p - 'a' + 10;
        else
        if (isspace(*p)) {
            p++;
            continue;
        } else {
            goto exit; // Invalid character.
        }
        
        if (highValue == -1) {
            highValue = value;
        } else {
            *b++ = (highValue << 4) | value;
            highValue = -1;
        }
        p++;
    }

    // If highValue != -1 then we got an odd number of hex values, which is an error.
    if (highValue == -1)
        data = [NSData dataWithBytes:bytes length:b-bytes];

exit:
    if (bytes) {
        BNCLogAssert((size_t)(b-bytes)<=length);
        free(bytes);
    }
    return data;
}

#pragma mark - URL QueryItems

+ (NSArray<BNCKeyValue*>*) queryItems:(NSURL*)URL {
    NSMutableArray* keyValues = [NSMutableArray new];
    if (!URL) return keyValues;

    NSArray *queryItems = [[URL query] componentsSeparatedByString:@"&"];
    for (NSString* itemPair in queryItems) {

        BNCKeyValue *keyValue = [BNCKeyValue new];
        NSRange range = [itemPair rangeOfString:@"="];
        if (range.location == NSNotFound) {
            if (itemPair.length)
                keyValue.key = itemPair;
        } else {
            keyValue.key = [itemPair substringWithRange:NSMakeRange(0, range.location)];
            NSRange r = NSMakeRange(range.location+1, itemPair.length-range.location-1);
            if (r.length > 0)
                keyValue.value = [itemPair substringWithRange:r];
        }

        keyValue.key = [BNCEncodingUtils stringByPercentDecodingString:keyValue.key];
        keyValue.key = [keyValue.key stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

        keyValue.value = [BNCEncodingUtils stringByPercentDecodingString:keyValue.value];
        keyValue.value = [keyValue.value stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

        if (keyValue.key.length || keyValue.value.length) {
            if (keyValue.key == nil) keyValue.key = @"";
            if (keyValue.value == nil) keyValue.value = @"";
            [keyValues addObject:keyValue];
        }
    }

    return keyValues;
}

@end
