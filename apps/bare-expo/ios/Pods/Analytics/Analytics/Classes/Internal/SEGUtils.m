//
//  SEGUtils.m
//
//

#import "SEGUtils.h"


@implementation SEGUtils

+ (NSData *_Nullable)dataFromPlist:(nonnull id)plist
{
    NSError *error = nil;
    NSData *data = [NSPropertyListSerialization dataWithPropertyList:plist
                                                              format:NSPropertyListXMLFormat_v1_0
                                                             options:0
                                                               error:&error];
    if (error) {
        SEGLog(@"Unable to serialize data from plist object", error, plist);
    }
    return data;
}

+ (id _Nullable)plistFromData:(NSData *_Nonnull)data
{
    NSError *error = nil;
    id plist = [NSPropertyListSerialization propertyListWithData:data
                                                         options:0
                                                          format:nil
                                                           error:&error];
    if (error) {
        SEGLog(@"Unable to parse plist from data %@", error);
    }
    return plist;
}


+(id)traverseJSON:(id)object andReplaceWithFilters:(NSDictionary<NSString*, NSString*>*)patterns
{
    if (object == nil || object == NSNull.null || [object isKindOfClass:NSNull.class]) {
        return object;
    }
    
    if ([object isKindOfClass:NSDictionary.class]) {
        NSDictionary* dict = object;
        NSMutableDictionary* newDict = [NSMutableDictionary dictionaryWithCapacity:dict.count];
        
        for (NSString* key in dict.allKeys) {
            newDict[key] = [self traverseJSON:dict[key] andReplaceWithFilters:patterns];
        }
        
        return newDict;
    }
    
    if ([object isKindOfClass:NSArray.class]) {
        NSArray* array = object;
        NSMutableArray* newArray = [NSMutableArray arrayWithCapacity:array.count];
        
        for (int i = 0; i < array.count; i++) {
            newArray[i] = [self traverseJSON:array[i] andReplaceWithFilters:patterns];
        }
        
        return newArray;
    }

    if ([object isKindOfClass:NSString.class]) {
        NSError* error = nil;
        NSMutableString* str = [object mutableCopy];
        
        for (NSString* pattern in patterns) {
            NSRegularExpression* re = [NSRegularExpression regularExpressionWithPattern:pattern
                                                                                options:0
                                                                                  error:&error];
            
            if (error) {
                @throw error;
            }
            
            NSInteger matches = [re replaceMatchesInString:str
                                                   options:0
                                                     range:NSMakeRange(0, str.length)
                                              withTemplate:patterns[pattern]];
            
            if (matches > 0) {
                SEGLog(@"%@ Redacted value from action: %@", self, pattern);
            }
        }
        
        return str;
    }
    
    return object;
}

@end
