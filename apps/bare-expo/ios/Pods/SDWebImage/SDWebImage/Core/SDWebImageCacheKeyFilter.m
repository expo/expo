/*
 * This file is part of the SDWebImage package.
 * (c) Olivier Poitrey <rs@dailymotion.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

#import "SDWebImageCacheKeyFilter.h"

@interface SDWebImageCacheKeyFilter ()

@property (nonatomic, copy, nonnull) SDWebImageCacheKeyFilterBlock block;

@end

@implementation SDWebImageCacheKeyFilter

- (instancetype)initWithBlock:(SDWebImageCacheKeyFilterBlock)block {
    self = [super init];
    if (self) {
        self.block = block;
    }
    return self;
}

+ (instancetype)cacheKeyFilterWithBlock:(SDWebImageCacheKeyFilterBlock)block {
    SDWebImageCacheKeyFilter *cacheKeyFilter = [[SDWebImageCacheKeyFilter alloc] initWithBlock:block];
    return cacheKeyFilter;
}

- (NSString *)cacheKeyForURL:(NSURL *)url {
    if (!self.block) {
        return nil;
    }
    return self.block(url);
}

@end
