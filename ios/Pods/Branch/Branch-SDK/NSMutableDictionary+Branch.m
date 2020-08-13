//
//  NSMutableDictionary+Branch.m
//  Branch
//
//  Created by Edward Smith on 1/11/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//


#import "NSMutableDictionary+Branch.h"


@implementation NSMutableDictionary (Branch)

- (void) bnc_safeSetObject:(id)anObject forKey:(id<NSCopying>)aKey {
	if (anObject && aKey) {
		[self setObject:anObject forKey:aKey];
	}
}

- (void) bnc_safeAddEntriesFromDictionary:(NSDictionary<id<NSCopying>,id> *)otherDictionary {
    if ([otherDictionary isKindOfClass:[NSDictionary class]]) {
        NSDictionary *deepCopy =
            [[NSDictionary alloc]
                initWithDictionary:otherDictionary
                copyItems:YES];
        [self addEntriesFromDictionary:deepCopy];
    }
}

@end


__attribute__((constructor)) void BNCForceNSMutableDictionaryCategoryToLoad(void) {
    //  Does nothing.  But will force the linker to include this category.
}
