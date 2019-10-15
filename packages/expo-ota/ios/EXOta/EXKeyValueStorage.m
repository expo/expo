//
//  EXKeyValueStorage.m
//  EXOta
//
//  Created by Michał Czernek on 09/09/2019.
//

#import "EXKeyValueStorage.h"

@implementation EXKeyValueStorage {
    NSString *moduleId;
}

- (instancetype)initWithId:(NSString *)identifier
{
    moduleId = identifier;
    return self;
}

- (void)removeValueForKey:(NSString *)key
{
    [NSUserDefaults.standardUserDefaults removeObjectForKey:[self keyWithId:key]];
}

- (void)persistString:(NSString *)value forKey:(NSString *)key {
    [NSUserDefaults.standardUserDefaults setObject:value forKey:[self keyWithId:key]];
}

- (NSString *)readStringForKey:(NSString *)key {
    return [NSUserDefaults.standardUserDefaults stringForKey:[self keyWithId:key]];
}

- (void)persistObject:(NSObject *)value forKey:(NSString *)key {
    [NSUserDefaults.standardUserDefaults setObject:value
                                            forKey:[self keyWithId:key]];
}

- (NSDictionary *)readObject:(NSString *)key {
    return [NSUserDefaults.standardUserDefaults objectForKey:[self keyWithId:key]];
}

- (void)persistBool:(BOOL)value forKey:(NSString *)key {
    [NSUserDefaults.standardUserDefaults setBool:value
                                            forKey:[self keyWithId:key]];
}

- (BOOL)readBool:(NSString *)key {
    return [NSUserDefaults.standardUserDefaults boolForKey:[self keyWithId:key]];
}

- (NSString *)keyWithId:(NSString *)key{
    return [NSString stringWithFormat:@"%@-%@", moduleId, key];
}

@end
