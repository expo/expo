//
//  EXKeyValueStorage.h
//  EXOta
//
//  Created by Michał Czernek on 09/09/2019.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXKeyValueStorage : NSObject

- (instancetype)init;
- (void)persistString:(NSString *)value forKey:(NSString *)key;
- (NSString *)readStringForKey:(NSString *)key;
- (void)persistObject:(NSObject *)value forKey:(NSString *)key;
- (NSDictionary *)readObject:(NSString *)key;


@end

NS_ASSUME_NONNULL_END
