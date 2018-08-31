//
//  ABI30_0_0RNBranchAgingDictionary.m
//  ABI30_0_0RNBranch
//
//  Created by Jimmy Dee on 3/8/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#import "ABI30_0_0RNBranchAgingDictionary.h"
#import "ABI30_0_0RNBranchAgingItem.h"

@interface ABI30_0_0RNBranchAgingDictionary()
@property (nonatomic) NSMutableDictionary *dictionary;
@end

@implementation ABI30_0_0RNBranchAgingDictionary

#pragma mark - Object lifecycle

+ (instancetype)dictionaryWithTtl:(NSTimeInterval)ttl
{
    return [[self alloc] initWithTtl:ttl];
}

- (instancetype)initWithTtl:(NSTimeInterval)ttl
{
    self = [super init];
    if (self) {
        _ttl = ttl;
        _dictionary = [NSMutableDictionary dictionary];
    }
    return self;
}

- (instancetype)init
{
    @throw nil;
}

#pragma mark - Methods from NSMutableDictionary

- (void)setObject:(id)anObject forKey:(id<NSCopying>)aKey
{
    [self insertItem:anObject forKey:aKey];
}

- (void)setObject:(id)obj forKeyedSubscript:(id<NSCopying>)key
{
    [self insertItem:obj forKey:key];
}

- (id)objectForKey:(id)aKey
{
    return [self itemForKey:aKey];
}

- (id)objectForKeyedSubscript:(id)key
{
    return [self itemForKey:key];
}

- (void)removeObjectForKey:(id)key
{
    [self.dictionary removeObjectForKey:key];
}

#pragma mark - Internal utilities

- (void)insertItem:(id)obj forKey:(id<NSCopying>)key
{
    [self ageItems];

    self.dictionary[key] = [[ABI30_0_0RNBranchAgingItem alloc] initWithItem:obj];
}

- (id)itemForKey:(id)key
{
    ABI30_0_0RNBranchAgingItem *item = self.dictionary[key];
    return item.item;
}

- (void)ageItems
{
    NSTimeInterval now = [NSDate date].timeIntervalSince1970;

    NSArray<NSString *> *keys = self.dictionary.allKeys; // copy of allKeys

    for (NSString *key in keys) {
        ABI30_0_0RNBranchAgingItem *item = self.dictionary[key];
        if ((now - item.accessTime) >= self.ttl) {
            [self.dictionary removeObjectForKey:key];
        }
    }
}

@end
