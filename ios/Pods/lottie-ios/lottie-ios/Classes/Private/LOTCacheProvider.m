//
//  LOTCacheProvider.m
//  Lottie
//
//  Created by punmy on 2017/7/8.
//
//

#import "LOTCacheProvider.h"

@implementation LOTCacheProvider

static id<LOTImageCache> _imageCache;

+ (id<LOTImageCache>)imageCache {
    return _imageCache;
}

+ (void)setImageCache:(id<LOTImageCache>)cache {
    _imageCache = cache;
}

@end
