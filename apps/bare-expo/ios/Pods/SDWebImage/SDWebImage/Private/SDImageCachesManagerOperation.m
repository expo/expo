/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageCachesManagerOperation.h"
#import "SDInternalMacros.h"

@implementation SDImageCachesManagerOperation
{
    dispatch_semaphore_t _pendingCountLock;
}

@synthesize executing = _executing;
@synthesize finished = _finished;
@synthesize cancelled = _cancelled;
@synthesize pendingCount = _pendingCount;

- (instancetype)init {
    if (self = [super init]) {
        _pendingCountLock = dispatch_semaphore_create(1);
        _pendingCount = 0;
    }
    return self;
}

- (void)beginWithTotalCount:(NSUInteger)totalCount {
    self.executing = YES;
    self.finished = NO;
    _pendingCount = totalCount;
}

- (NSUInteger)pendingCount {
    SD_LOCK(_pendingCountLock);
    NSUInteger pendingCount = _pendingCount;
    SD_UNLOCK(_pendingCountLock);
    return pendingCount;
}

- (void)completeOne {
    SD_LOCK(_pendingCountLock);
    _pendingCount = _pendingCount > 0 ? _pendingCount - 1 : 0;
    SD_UNLOCK(_pendingCountLock);
}

- (void)cancel {
    self.cancelled = YES;
    [self reset];
}

- (void)done {
    self.finished = YES;
    self.executing = NO;
    [self reset];
}

- (void)reset {
    SD_LOCK(_pendingCountLock);
    _pendingCount = 0;
    SD_UNLOCK(_pendingCountLock);
}

- (void)setFinished:(BOOL)finished {
    [self willChangeValueForKey:@"isFinished"];
    _finished = finished;
    [self didChangeValueForKey:@"isFinished"];
}

- (void)setExecuting:(BOOL)executing {
    [self willChangeValueForKey:@"isExecuting"];
    _executing = executing;
    [self didChangeValueForKey:@"isExecuting"];
}

- (void)setCancelled:(BOOL)cancelled {
    [self willChangeValueForKey:@"isCancelled"];
    _cancelled = cancelled;
    [self didChangeValueForKey:@"isCancelled"];
}

@end
