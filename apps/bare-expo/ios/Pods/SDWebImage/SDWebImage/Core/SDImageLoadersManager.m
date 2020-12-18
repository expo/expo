/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDImageLoadersManager.h"
#import "SDWebImageDownloader.h"
#import "SDInternalMacros.h"

@interface SDImageLoadersManager ()

@property (nonatomic, strong, nonnull) NSMutableArray<id<SDImageLoader>> *imageLoaders;

@end

@implementation SDImageLoadersManager {
    SD_LOCK_DECLARE(_loadersLock);
}

+ (SDImageLoadersManager *)sharedManager {
    static dispatch_once_t onceToken;
    static SDImageLoadersManager *manager;
    dispatch_once(&onceToken, ^{
        manager = [[SDImageLoadersManager alloc] init];
    });
    return manager;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        // initialize with default image loaders
        _imageLoaders = [NSMutableArray arrayWithObject:[SDWebImageDownloader sharedDownloader]];
        SD_LOCK_INIT(_loadersLock);
    }
    return self;
}

- (NSArray<id<SDImageLoader>> *)loaders {
    SD_LOCK(_loadersLock);
    NSArray<id<SDImageLoader>>* loaders = [_imageLoaders copy];
    SD_UNLOCK(_loadersLock);
    return loaders;
}

- (void)setLoaders:(NSArray<id<SDImageLoader>> *)loaders {
    SD_LOCK(_loadersLock);
    [_imageLoaders removeAllObjects];
    if (loaders.count) {
        [_imageLoaders addObjectsFromArray:loaders];
    }
    SD_UNLOCK(_loadersLock);
}

#pragma mark - Loader Property

- (void)addLoader:(id<SDImageLoader>)loader {
    if (![loader conformsToProtocol:@protocol(SDImageLoader)]) {
        return;
    }
    SD_LOCK(_loadersLock);
    [_imageLoaders addObject:loader];
    SD_UNLOCK(_loadersLock);
}

- (void)removeLoader:(id<SDImageLoader>)loader {
    if (![loader conformsToProtocol:@protocol(SDImageLoader)]) {
        return;
    }
    SD_LOCK(_loadersLock);
    [_imageLoaders removeObject:loader];
    SD_UNLOCK(_loadersLock);
}

#pragma mark - SDImageLoader

- (BOOL)canRequestImageForURL:(nullable NSURL *)url {
    NSArray<id<SDImageLoader>> *loaders = self.loaders;
    for (id<SDImageLoader> loader in loaders.reverseObjectEnumerator) {
        if ([loader canRequestImageForURL:url]) {
            return YES;
        }
    }
    return NO;
}

- (id<SDWebImageOperation>)requestImageWithURL:(NSURL *)url options:(SDWebImageOptions)options context:(SDWebImageContext *)context progress:(SDImageLoaderProgressBlock)progressBlock completed:(SDImageLoaderCompletedBlock)completedBlock {
    if (!url) {
        return nil;
    }
    NSArray<id<SDImageLoader>> *loaders = self.loaders;
    for (id<SDImageLoader> loader in loaders.reverseObjectEnumerator) {
        if ([loader canRequestImageForURL:url]) {
            return [loader requestImageWithURL:url options:options context:context progress:progressBlock completed:completedBlock];
        }
    }
    return nil;
}

- (BOOL)shouldBlockFailedURLWithURL:(NSURL *)url error:(NSError *)error {
    NSArray<id<SDImageLoader>> *loaders = self.loaders;
    for (id<SDImageLoader> loader in loaders.reverseObjectEnumerator) {
        if ([loader canRequestImageForURL:url]) {
            return [loader shouldBlockFailedURLWithURL:url error:error];
        }
    }
    return NO;
}

@end
