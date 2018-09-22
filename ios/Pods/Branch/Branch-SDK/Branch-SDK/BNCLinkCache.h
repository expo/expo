//
//  BNCLinkCache.h
//  Branch-SDK
//
//  Created by Qinwei Gong on 1/23/15.
//  Copyright (c) 2015 Branch Metrics. All rights reserved.
//

#import "BNCLinkData.h"

@interface BNCLinkCache : NSObject
- (void)setObject:(NSString *)anObject forKey:(BNCLinkData *)aKey;
- (NSString *)objectForKey:(BNCLinkData *)aKey;
- (void) clear;
@end
