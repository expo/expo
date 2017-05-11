//
//  RNBranchAgingDictionary.h
//  RNBranch
//
//  Created by Jimmy Dee on 3/8/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface RNBranchAgingDictionary<KeyType, ObjectType> : NSObject

@property (nonatomic, readonly) NSTimeInterval ttl;

#pragma mark - Object lifecycle

- (instancetype _Nullable)init NS_UNAVAILABLE;
- (instancetype _Nonnull)initWithTtl:(NSTimeInterval)ttl NS_DESIGNATED_INITIALIZER;

+ (instancetype _Nonnull)dictionaryWithTtl:(NSTimeInterval)ttl;

#pragma mark - Methods from NSMutableDictionary

- (void)setObject:(ObjectType _Nonnull)object forKey:(KeyType<NSCopying> _Nonnull)key;
- (void)setObject:(ObjectType _Nonnull)object forKeyedSubscript:(KeyType<NSCopying> _Nonnull)key;

- (nullable ObjectType)objectForKey:(KeyType _Nonnull)key;
- (nullable ObjectType)objectForKeyedSubscript:(KeyType _Nonnull)key;

- (void)removeObjectForKey:(KeyType _Nonnull)key;

@end
