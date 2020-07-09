/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageCachesManager.h"
#import "SDImageCachesManagerOperation.h"
#import "SDImageCache.h"
#import "SDInternalMacros.h"

@interface SDImageCachesManager ()

@property (nonatomic, strong, nonnull) dispatch_semaphore_t cachesLock;

@end

@implementation SDImageCachesManager
{
    NSMutableArray<id<SDImageCache>> *_imageCaches;
}

+ (SDImageCachesManager *)sharedManager {
    static dispatch_once_t onceToken;
    static SDImageCachesManager *manager;
    dispatch_once(&onceToken, ^{
        manager = [[SDImageCachesManager alloc] init];
    });
    return manager;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        self.queryOperationPolicy = SDImageCachesManagerOperationPolicySerial;
        self.storeOperationPolicy = SDImageCachesManagerOperationPolicyHighestOnly;
        self.removeOperationPolicy = SDImageCachesManagerOperationPolicyConcurrent;
        self.containsOperationPolicy = SDImageCachesManagerOperationPolicySerial;
        self.clearOperationPolicy = SDImageCachesManagerOperationPolicyConcurrent;
        // initialize with default image caches
        _imageCaches = [NSMutableArray arrayWithObject:[SDImageCache sharedImageCache]];
        _cachesLock = dispatch_semaphore_create(1);
    }
    return self;
}

- (NSArray<id<SDImageCache>> *)caches {
    SD_LOCK(self.cachesLock);
    NSArray<id<SDImageCache>> *caches = [_imageCaches copy];
    SD_UNLOCK(self.cachesLock);
    return caches;
}

- (void)setCaches:(NSArray<id<SDImageCache>> *)caches {
    SD_LOCK(self.cachesLock);
    [_imageCaches removeAllObjects];
    if (caches.count) {
        [_imageCaches addObjectsFromArray:caches];
    }
    SD_UNLOCK(self.cachesLock);
}

#pragma mark - Cache IO operations

- (void)addCache:(id<SDImageCache>)cache {
    if (![cache conformsToProtocol:@protocol(SDImageCache)]) {
        return;
    }
    SD_LOCK(self.cachesLock);
    [_imageCaches addObject:cache];
    SD_UNLOCK(self.cachesLock);
}

- (void)removeCache:(id<SDImageCache>)cache {
    if (![cache conformsToProtocol:@protocol(SDImageCache)]) {
        return;
    }
    SD_LOCK(self.cachesLock);
    [_imageCaches removeObject:cache];
    SD_UNLOCK(self.cachesLock);
}

#pragma mark - SDImageCache

- (id<SDWebImageOperation>)queryImageForKey:(NSString *)key options:(SDWebImageOptions)options context:(SDWebImageContext *)context completion:(SDImageCacheQueryCompletionBlock)completionBlock {
    return [self queryImageForKey:key options:options context:context cacheType:SDImageCacheTypeAll completion:completionBlock];
}

- (id<SDWebImageOperation>)queryImageForKey:(NSString *)key options:(SDWebImageOptions)options context:(SDWebImageContext *)context cacheType:(SDImageCacheType)cacheType completion:(SDImageCacheQueryCompletionBlock)completionBlock {
    if (!key) {
        return nil;
    }
    NSArray<id<SDImageCache>> *caches = self.caches;
    NSUInteger count = caches.count;
    if (count == 0) {
        return nil;
    } else if (count == 1) {
        return [caches.firstObject queryImageForKey:key options:options context:context cacheType:cacheType completion:completionBlock];
    }
    switch (self.queryOperationPolicy) {
        case SDImageCachesManagerOperationPolicyHighestOnly: {
            id<SDImageCache> cache = caches.lastObject;
            return [cache queryImageForKey:key options:options context:context cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyLowestOnly: {
            id<SDImageCache> cache = caches.firstObject;
            return [cache queryImageForKey:key options:options context:context cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyConcurrent: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self concurrentQueryImageForKey:key options:options context:context cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
            return operation;
        }
            break;
        case SDImageCachesManagerOperationPolicySerial: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self serialQueryImageForKey:key options:options context:context cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
            return operation;
        }
            break;
        default:
            return nil;
            break;
    }
}

- (void)storeImage:(UIImage *)image imageData:(NSData *)imageData forKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock {
    if (!key) {
        return;
    }
    NSArray<id<SDImageCache>> *caches = self.caches;
    NSUInteger count = caches.count;
    if (count == 0) {
        return;
    } else if (count == 1) {
        [caches.firstObject storeImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock];
        return;
    }
    switch (self.storeOperationPolicy) {
        case SDImageCachesManagerOperationPolicyHighestOnly: {
            id<SDImageCache> cache = caches.lastObject;
            [cache storeImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyLowestOnly: {
            id<SDImageCache> cache = caches.firstObject;
            [cache storeImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyConcurrent: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self concurrentStoreImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
        }
            break;
        case SDImageCachesManagerOperationPolicySerial: {
            [self serialStoreImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator];
        }
            break;
        default:
            break;
    }
}

- (void)removeImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock {
    if (!key) {
        return;
    }
    NSArray<id<SDImageCache>> *caches = self.caches;
    NSUInteger count = caches.count;
    if (count == 0) {
        return;
    } else if (count == 1) {
        [caches.firstObject removeImageForKey:key cacheType:cacheType completion:completionBlock];
        return;
    }
    switch (self.removeOperationPolicy) {
        case SDImageCachesManagerOperationPolicyHighestOnly: {
            id<SDImageCache> cache = caches.lastObject;
            [cache removeImageForKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyLowestOnly: {
            id<SDImageCache> cache = caches.firstObject;
            [cache removeImageForKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyConcurrent: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self concurrentRemoveImageForKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
        }
            break;
        case SDImageCachesManagerOperationPolicySerial: {
            [self serialRemoveImageForKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator];
        }
            break;
        default:
            break;
    }
}

- (void)containsImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDImageCacheContainsCompletionBlock)completionBlock {
    if (!key) {
        return;
    }
    NSArray<id<SDImageCache>> *caches = self.caches;
    NSUInteger count = caches.count;
    if (count == 0) {
        return;
    } else if (count == 1) {
        [caches.firstObject containsImageForKey:key cacheType:cacheType completion:completionBlock];
        return;
    }
    switch (self.clearOperationPolicy) {
        case SDImageCachesManagerOperationPolicyHighestOnly: {
            id<SDImageCache> cache = caches.lastObject;
            [cache containsImageForKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyLowestOnly: {
            id<SDImageCache> cache = caches.firstObject;
            [cache containsImageForKey:key cacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyConcurrent: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self concurrentContainsImageForKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
        }
            break;
        case SDImageCachesManagerOperationPolicySerial: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self serialContainsImageForKey:key cacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
        }
            break;
        default:
            break;
    }
}

- (void)clearWithCacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock {
    NSArray<id<SDImageCache>> *caches = self.caches;
    NSUInteger count = caches.count;
    if (count == 0) {
        return;
    } else if (count == 1) {
        [caches.firstObject clearWithCacheType:cacheType completion:completionBlock];
        return;
    }
    switch (self.clearOperationPolicy) {
        case SDImageCachesManagerOperationPolicyHighestOnly: {
            id<SDImageCache> cache = caches.lastObject;
            [cache clearWithCacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyLowestOnly: {
            id<SDImageCache> cache = caches.firstObject;
            [cache clearWithCacheType:cacheType completion:completionBlock];
        }
            break;
        case SDImageCachesManagerOperationPolicyConcurrent: {
            SDImageCachesManagerOperation *operation = [SDImageCachesManagerOperation new];
            [operation beginWithTotalCount:caches.count];
            [self concurrentClearWithCacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator operation:operation];
        }
            break;
        case SDImageCachesManagerOperationPolicySerial: {
            [self serialClearWithCacheType:cacheType completion:completionBlock enumerator:caches.reverseObjectEnumerator];
        }
            break;
        default:
            break;
    }
}

#pragma mark - Concurrent Operation

- (void)concurrentQueryImageForKey:(NSString *)key options:(SDWebImageOptions)options context:(SDWebImageContext *)context cacheType:(SDImageCacheType)queryCacheType completion:(SDImageCacheQueryCompletionBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    for (id<SDImageCache> cache in enumerator) {
        [cache queryImageForKey:key options:options context:context cacheType:queryCacheType completion:^(UIImage * _Nullable image, NSData * _Nullable data, SDImageCacheType cacheType) {
            if (operation.isCancelled) {
                // Cancelled
                return;
            }
            if (operation.isFinished) {
                // Finished
                return;
            }
            [operation completeOne];
            if (image) {
                // Success
                [operation done];
                if (completionBlock) {
                    completionBlock(image, data, cacheType);
                }
                return;
            }
            if (operation.pendingCount == 0) {
                // Complete
                [operation done];
                if (completionBlock) {
                    completionBlock(nil, nil, SDImageCacheTypeNone);
                }
            }
        }];
    }
}

- (void)concurrentStoreImage:(UIImage *)image imageData:(NSData *)imageData forKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    for (id<SDImageCache> cache in enumerator) {
        [cache storeImage:image imageData:imageData forKey:key cacheType:cacheType completion:^{
            if (operation.isCancelled) {
                // Cancelled
                return;
            }
            if (operation.isFinished) {
                // Finished
                return;
            }
            [operation completeOne];
            if (operation.pendingCount == 0) {
                // Complete
                [operation done];
                if (completionBlock) {
                    completionBlock();
                }
            }
        }];
    }
}

- (void)concurrentRemoveImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    for (id<SDImageCache> cache in enumerator) {
        [cache removeImageForKey:key cacheType:cacheType completion:^{
            if (operation.isCancelled) {
                // Cancelled
                return;
            }
            if (operation.isFinished) {
                // Finished
                return;
            }
            [operation completeOne];
            if (operation.pendingCount == 0) {
                // Complete
                [operation done];
                if (completionBlock) {
                    completionBlock();
                }
            }
        }];
    }
}

- (void)concurrentContainsImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDImageCacheContainsCompletionBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    for (id<SDImageCache> cache in enumerator) {
        [cache containsImageForKey:key cacheType:cacheType completion:^(SDImageCacheType containsCacheType) {
            if (operation.isCancelled) {
                // Cancelled
                return;
            }
            if (operation.isFinished) {
                // Finished
                return;
            }
            [operation completeOne];
            if (containsCacheType != SDImageCacheTypeNone) {
                // Success
                [operation done];
                if (completionBlock) {
                    completionBlock(containsCacheType);
                }
                return;
            }
            if (operation.pendingCount == 0) {
                // Complete
                [operation done];
                if (completionBlock) {
                    completionBlock(SDImageCacheTypeNone);
                }
            }
        }];
    }
}

- (void)concurrentClearWithCacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    for (id<SDImageCache> cache in enumerator) {
        [cache clearWithCacheType:cacheType completion:^{
            if (operation.isCancelled) {
                // Cancelled
                return;
            }
            if (operation.isFinished) {
                // Finished
                return;
            }
            [operation completeOne];
            if (operation.pendingCount == 0) {
                // Complete
                [operation done];
                if (completionBlock) {
                    completionBlock();
                }
            }
        }];
    }
}

#pragma mark - Serial Operation

- (void)serialQueryImageForKey:(NSString *)key options:(SDWebImageOptions)options context:(SDWebImageContext *)context cacheType:(SDImageCacheType)queryCacheType completion:(SDImageCacheQueryCompletionBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    id<SDImageCache> cache = enumerator.nextObject;
    if (!cache) {
        // Complete
        [operation done];
        if (completionBlock) {
            completionBlock(nil, nil, SDImageCacheTypeNone);
        }
        return;
    }
    @weakify(self);
    [cache queryImageForKey:key options:options context:context cacheType:queryCacheType completion:^(UIImage * _Nullable image, NSData * _Nullable data, SDImageCacheType cacheType) {
        @strongify(self);
        if (operation.isCancelled) {
            // Cancelled
            return;
        }
        if (operation.isFinished) {
            // Finished
            return;
        }
        [operation completeOne];
        if (image) {
            // Success
            [operation done];
            if (completionBlock) {
                completionBlock(image, data, cacheType);
            }
            return;
        }
        // Next
        [self serialQueryImageForKey:key options:options context:context cacheType:queryCacheType completion:completionBlock enumerator:enumerator operation:operation];
    }];
}

- (void)serialStoreImage:(UIImage *)image imageData:(NSData *)imageData forKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator {
    NSParameterAssert(enumerator);
    id<SDImageCache> cache = enumerator.nextObject;
    if (!cache) {
        // Complete
        if (completionBlock) {
            completionBlock();
        }
        return;
    }
    @weakify(self);
    [cache storeImage:image imageData:imageData forKey:key cacheType:cacheType completion:^{
        @strongify(self);
        // Next
        [self serialStoreImage:image imageData:imageData forKey:key cacheType:cacheType completion:completionBlock enumerator:enumerator];
    }];
}

- (void)serialRemoveImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator {
    NSParameterAssert(enumerator);
    id<SDImageCache> cache = enumerator.nextObject;
    if (!cache) {
        // Complete
        if (completionBlock) {
            completionBlock();
        }
        return;
    }
    @weakify(self);
    [cache removeImageForKey:key cacheType:cacheType completion:^{
        @strongify(self);
        // Next
        [self serialRemoveImageForKey:key cacheType:cacheType completion:completionBlock enumerator:enumerator];
    }];
}

- (void)serialContainsImageForKey:(NSString *)key cacheType:(SDImageCacheType)cacheType completion:(SDImageCacheContainsCompletionBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator operation:(SDImageCachesManagerOperation *)operation {
    NSParameterAssert(enumerator);
    NSParameterAssert(operation);
    id<SDImageCache> cache = enumerator.nextObject;
    if (!cache) {
        // Complete
        [operation done];
        if (completionBlock) {
            completionBlock(SDImageCacheTypeNone);
        }
        return;
    }
    @weakify(self);
    [cache containsImageForKey:key cacheType:cacheType completion:^(SDImageCacheType containsCacheType) {
        @strongify(self);
        if (operation.isCancelled) {
            // Cancelled
            return;
        }
        if (operation.isFinished) {
            // Finished
            return;
        }
        [operation completeOne];
        if (containsCacheType != SDImageCacheTypeNone) {
            // Success
            [operation done];
            if (completionBlock) {
                completionBlock(containsCacheType);
            }
            return;
        }
        // Next
        [self serialContainsImageForKey:key cacheType:cacheType completion:completionBlock enumerator:enumerator operation:operation];
    }];
}

- (void)serialClearWithCacheType:(SDImageCacheType)cacheType completion:(SDWebImageNoParamsBlock)completionBlock enumerator:(NSEnumerator<id<SDImageCache>> *)enumerator {
    NSParameterAssert(enumerator);
    id<SDImageCache> cache = enumerator.nextObject;
    if (!cache) {
        // Complete
        if (completionBlock) {
            completionBlock();
        }
        return;
    }
    @weakify(self);
    [cache clearWithCacheType:cacheType completion:^{
        @strongify(self);
        // Next
        [self serialClearWithCacheType:cacheType completion:completionBlock enumerator:enumerator];
    }];
}

@end
