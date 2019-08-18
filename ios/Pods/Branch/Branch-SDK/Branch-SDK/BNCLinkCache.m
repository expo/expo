//
//  BNCLinkCache.m
//  Branch-SDK
//
//  Created by Qinwei Gong on 1/23/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//


#import "BNCLinkCache.h"


@interface BNCLinkCache ()
@property (nonatomic, strong) NSMutableDictionary *cache;
@end


@implementation BNCLinkCache

- (id)init {
    if ((self = [super init])) {
        self.cache = [[NSMutableDictionary alloc] init];
    }
    return self;
}

- (void)setObject:(NSString *)anObject forKey:(BNCLinkData *)aKey {
    @synchronized (self) {
        self.cache[@([aKey hash])] = anObject;
    }
}

- (NSString *)objectForKey:(BNCLinkData *)aKey {
    @synchronized (self) {
        return self.cache[@([aKey hash])];
    }
}

- (void) clear {
    @synchronized (self) {
        [self.cache removeAllObjects];
    }
}

@end
