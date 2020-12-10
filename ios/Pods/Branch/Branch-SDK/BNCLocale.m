//
//  BNCLocale.m
//  Branch
//
//  Created by Ernest Cho on 11/18/19.
//  Copyright © 2019 Branch, Inc. All rights reserved.
//

#import "BNCLocale.h"

@implementation BNCLocale

- (nullable NSString *)country {
    NSString *country = [self countryOS10];
    
    if (!country) {
        country = [self countryOS8];
    }
    
    if (country && country.length > 0) {
        return country;
    } else {
        return nil;
    }
}

- (nullable NSString *)countryOS10 {
    NSString *country = nil;
    if (@available(iOS 10, tvOS 10, *)) {
        country = [[NSLocale currentLocale] countryCode];
    }
    return country;
}

- (nullable NSString *)countryOS8 {
    NSString *country = nil;
    NSString *rawLocale = [[NSLocale currentLocale] localeIdentifier];
    NSRange range = [rawLocale rangeOfString:@"_"];
    if (range.location != NSNotFound) {
        range = NSMakeRange(range.location+1, rawLocale.length-range.location-1);
        country = [rawLocale substringWithRange:range];
    }
    return country;
}

- (nullable NSString *)language {
    NSString *language = [self languageOS10];
    
    if (!language) {
        language = [self languageOS9];
    }
    
    if (!language) {
        language = [self languageOS8];
    }
    
    if (language && language.length > 0) {
        return language;
    } else {
        return nil;
    }
}

- (nullable NSString *)languageOS10 {
    NSString *language = nil;
    if (@available(iOS 10, tvOS 10, *)) {
        language = [[NSLocale currentLocale] languageCode];
    }
    return language;
}

- (nullable NSString *)languageOS9 {
    NSString *language = nil;

    NSString *rawLanguage = [[NSLocale preferredLanguages] firstObject];
    NSDictionary *languageDictionary = [NSLocale componentsFromLocaleIdentifier:rawLanguage];
    language = [languageDictionary objectForKey:@"kCFLocaleLanguageCodeKey"];

    return language;
}

- (nullable NSString *)languageOS8 {
    return [[NSLocale preferredLanguages] firstObject];
}

@end
