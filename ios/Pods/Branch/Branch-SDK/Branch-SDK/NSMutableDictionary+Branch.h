//
//  NSMutableDictionary+Branch.h
//  Branch
//
//  Created by Edward Smith on 1/11/17.
//  Copyright © 2017 Branch Metrics. All rights reserved.
//

#if __has_feature(modules)
@import Foundation;
#else
#import <Foundation/Foundation.h>
#endif

void BNCForceNSMutableDictionaryCategoryToLoad(void) __attribute__((constructor));

@interface NSMutableDictionary (Branch)

- (void) bnc_safeSetObject:(id)anObject forKey:(id<NSCopying>)aKey;
- (void) bnc_safeAddEntriesFromDictionary:(NSDictionary<id<NSCopying>,id> *)otherDictionary;

@end
