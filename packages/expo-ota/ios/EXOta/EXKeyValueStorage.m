//
//  EXKeyValueStorage.m
//  EXOta
//
//  Created by Michał Czernek on 09/09/2019.
//

#import "EXKeyValueStorage.h"

@implementation EXKeyValueStorage

- (instancetype)init
{
    return self;
}

- (void)persistString:(NSString *)value forKey:(NSString *)key {
    [NSUserDefaults.standardUserDefaults setObject:value forKey:key];
}

- (NSString *)readStringForKey:(NSString *)key {
    return [NSUserDefaults.standardUserDefaults objectForKey:key];
}

- (void)persistObject:(NSObject *)value forKey:(NSString *)key {
    [NSUserDefaults.standardUserDefaults setObject:value
                                            forKey:key];
}

- (NSDictionary *)readObject:(NSString *)key {
    return [NSUserDefaults.standardUserDefaults objectForKey:key];
}

@end
