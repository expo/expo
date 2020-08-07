//
//  BNCServerRequestQueue.h
//  Branch-SDK
//
//  Created by Qinwei Gong on 9/6/14.
//  Copyright (c) 2014 Branch Metrics. All rights reserved.
//

#import "BNCServerRequest.h"
@class BranchOpenRequest;

@interface BNCServerRequestQueue : NSObject

- (void)enqueue:(BNCServerRequest *)request;
- (BNCServerRequest *)dequeue;
- (BNCServerRequest *)peek;
- (BNCServerRequest *)peekAt:(NSUInteger)index;
- (void)insert:(BNCServerRequest *)request at:(NSUInteger)index;
- (BNCServerRequest *)removeAt:(NSUInteger)index;
- (void)remove:(BNCServerRequest *)request;
- (void)persistEventually;
- (void)persistImmediately;
- (void)clearQueue;

- (BOOL)containsInstallOrOpen;
- (BOOL)removeInstallOrOpen;
- (BOOL)containsClose;
- (BranchOpenRequest *)moveInstallOrOpenToFront:(NSInteger)networkCount;

+ (id)getInstance;

@property (readonly, assign, atomic) NSInteger queueDepth;
@property (readonly, assign, atomic) BOOL isDirty;
@end
