//
//  SEGUserDefaultsStorage.m
//  Analytics
//
//  Created by Tony Xiao on 8/24/16.
//  Copyright © 2016 Segment. All rights reserved.
//

#import "SEGUtils.h"
#import "SEGUserDefaultsStorage.h"
#import "SEGCrypto.h"


@implementation SEGUserDefaultsStorage

- (instancetype)initWithDefaults:(NSUserDefaults *)defaults namespacePrefix:(NSString *)namespacePrefix crypto:(id<SEGCrypto>)crypto
{
    if (self = [super init]) {
        _defaults = defaults;
        _namespacePrefix = namespacePrefix;
        _crypto = crypto;
    }
    return self;
}

- (void)removeKey:(NSString *)key
{
    [self.defaults removeObjectForKey:[self namespacedKey:key]];
}

- (void)resetAll
{
    // Courtesy of http://stackoverflow.com/questions/6358737/nsuserdefaults-reset
    if (!self.namespacePrefix) {
        NSString *domainName = [[NSBundle mainBundle] bundleIdentifier];
        if (domainName) {
            [self.defaults removePersistentDomainForName:domainName];
            return;
        }
    }
    for (NSString *key in self.defaults.dictionaryRepresentation.allKeys) {
        if (!self.namespacePrefix || [key hasPrefix:self.namespacePrefix]) {
            [self.defaults removeObjectForKey:key];
        }
    }
    [self.defaults synchronize];
}

- (void)setObject:(id)object forKey:(NSString *)key
{
    // pass through for NSUserDefaults to remove keys if supplied a nil value.
    if (object) {
        [self.defaults setObject:object forKey:key];
    } else {
        [self.defaults removeObjectForKey:key];
    }
}

- (void)setData:(NSData *)data forKey:(NSString *)key
{
    key = [self namespacedKey:key];
    if (!self.crypto) {
        [self.defaults setObject:data forKey:key];
        return;
    }
    NSData *encryptedData = [self.crypto encrypt:data];
    [self setObject:encryptedData forKey:key];
}

- (NSData *)dataForKey:(NSString *)key
{
    key = [self namespacedKey:key];
    if (!self.crypto) {
        return [self.defaults objectForKey:key];
    }
    NSData *data = [self.defaults objectForKey:key];
    if (!data) {
        SEGLog(@"WARNING: No data file for key %@", key);
        return nil;
    }
    return [self.crypto decrypt:data];
}

- (NSDictionary *)dictionaryForKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        return [self.defaults dictionaryForKey:key];
    }
    return [self plistForKey:key];
}

- (void)setDictionary:(NSDictionary *)dictionary forKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        [self setObject:dictionary forKey:key];
        return;
    }
    [self setPlist:dictionary forKey:key];
}

- (NSArray *)arrayForKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        return [self.defaults arrayForKey:key];
    }
    return [self plistForKey:key];
}

- (void)setArray:(NSArray *)array forKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        [self setObject:array forKey:key];
        return;
    }
    [self setPlist:array forKey:key];
}

- (NSString *)stringForKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        return [self.defaults stringForKey:key];
    }
    return [self plistForKey:key];
}

- (void)setString:(NSString *)string forKey:(NSString *)key
{
    if (!self.crypto) {
        key = [self namespacedKey:key];
        [self setObject:string forKey:key];
        return;
    }
    [self setPlist:string forKey:key];
}

#pragma mark - Helpers

- (id _Nullable)plistForKey:(NSString *)key
{
    NSData *data = [self dataForKey:key];
    return data ? [SEGUtils plistFromData:data] : nil;
}

- (void)setPlist:(id _Nonnull)plist forKey:(NSString *)key
{
    NSData *data = [SEGUtils dataFromPlist:plist];
    if (data) {
        [self setData:data forKey:key];
    }
}

- (NSString *)namespacedKey:(NSString *)key
{
    if (self.namespacePrefix) {
        return [NSString stringWithFormat:@"%@.%@", self.namespacePrefix, key];
    }
    return key;
}

@end
