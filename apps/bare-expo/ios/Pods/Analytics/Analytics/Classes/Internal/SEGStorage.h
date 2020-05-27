//
//  SEGStorage.h
//  Analytics
//
//  Copyright © 2016 Segment. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "SEGCrypto.h"

@protocol SEGStorage <NSObject>

@property (nonatomic, strong, nullable) id<SEGCrypto> crypto;

- (void)removeKey:(NSString *_Nonnull)key;
- (void)resetAll;

- (void)setData:(NSData *_Nullable)data forKey:(NSString *_Nonnull)key;
- (NSData *_Nullable)dataForKey:(NSString *_Nonnull)key;

- (void)setDictionary:(NSDictionary *_Nullable)dictionary forKey:(NSString *_Nonnull)key;
- (NSDictionary *_Nullable)dictionaryForKey:(NSString *_Nonnull)key;

- (void)setArray:(NSArray *_Nullable)array forKey:(NSString *_Nonnull)key;
- (NSArray *_Nullable)arrayForKey:(NSString *_Nonnull)key;

- (void)setString:(NSString *_Nullable)string forKey:(NSString *_Nonnull)key;
- (NSString *_Nullable)stringForKey:(NSString *_Nonnull)key;

// Number and Booleans are intentionally omitted at the moment because they are not needed

@end
