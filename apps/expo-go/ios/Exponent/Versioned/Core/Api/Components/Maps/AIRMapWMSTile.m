//
//  AIRMapWMSTile.m
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#import "AIRMapWMSTile.h"
#import <React/UIView+React.h>

@implementation AIRMapWMSTile
 
- (void)createTileOverlayAndRendererIfPossible
{
    if (!_urlTemplateSet) return;
    if (_tileCachePathSet || _maximumNativeZSet) {
        NSLog(@"tileCache new overlay dir %@", self.tileCachePath);
        NSLog(@"tileCache %d", _tileCachePathSet);
        NSLog(@"tileCache %d", _maximumNativeZSet);
        self.tileOverlay = [[AIRMapWMSTileCachedOverlay alloc] initWithURLTemplate:self.urlTemplate];
        _cachedOverlayCreated = YES;
        if (_tileCachePathSet) {
            NSURL *urlPath = [NSURL URLWithString:[self.tileCachePath stringByAppendingString:@"/"]];
            if (urlPath.fileURL) {
                self.tileOverlay.tileCachePath = urlPath;
            } else {
                NSURL *filePath = [NSURL fileURLWithPath:self.tileCachePath isDirectory:YES];
                self.tileOverlay.tileCachePath = filePath;
            }

            if (_tileCacheMaxAgeSet) {
                self.tileOverlay.tileCacheMaxAge = self.tileCacheMaxAge;
            }
        }
    } else {
        NSLog(@"tileCache normal overlay");
        self.tileOverlay = [[AIRMapWMSTileOverlay alloc] initWithURLTemplate:self.urlTemplate];
        _cachedOverlayCreated = NO;
    }

    [self updateProperties];

    self.renderer = [[MKTileOverlayRenderer alloc] initWithTileOverlay:self.tileOverlay];
    if (_opacitySet) {
        self.renderer.alpha = self.opacity;
    }
}

@end


@implementation AIRMapWMSTileOverlay

- (id)initWithURLTemplate:(NSString *)URLTemplate 
{
    self = [super initWithURLTemplate:URLTemplate];
    return self;
}

- (NSURL *)URLForTilePath:(MKTileOverlayPath)path
{
   return [AIRMapWMSTileHelper URLForTilePath:path withURLTemplate:self.URLTemplate withTileSize:self.tileSize.width];
}

@end


@implementation AIRMapWMSTileCachedOverlay

- (id)initWithURLTemplate:(NSString *)URLTemplate 
{
    self = [super initWithURLTemplate:URLTemplate];
    return self;
}

- (NSURL *)URLForTilePath:(MKTileOverlayPath)path
{
   return [AIRMapWMSTileHelper URLForTilePath:path withURLTemplate:self.URLTemplate withTileSize:self.tileSize.width];
}

@end


@implementation AIRMapWMSTileHelper 
+ (NSURL *)URLForTilePath:(MKTileOverlayPath)path withURLTemplate:(NSString *)URLTemplate withTileSize:(NSInteger)tileSize
{
    NSArray *bb = [self getBoundBox:path.x yAxis:path.y zoom:path.z];
    NSMutableString *url = [URLTemplate mutableCopy];
    [url replaceOccurrencesOfString: @"{minX}" withString:[NSString stringWithFormat:@"%@", bb[0]] options:0 range:NSMakeRange(0, url.length)];
    [url replaceOccurrencesOfString: @"{minY}" withString:[NSString stringWithFormat:@"%@", bb[1]] options:0 range:NSMakeRange(0, url.length)];
    [url replaceOccurrencesOfString: @"{maxX}" withString:[NSString stringWithFormat:@"%@", bb[2]] options:0 range:NSMakeRange(0, url.length)];
    [url replaceOccurrencesOfString: @"{maxY}" withString:[NSString stringWithFormat:@"%@", bb[3]] options:0 range:NSMakeRange(0, url.length)];
    [url replaceOccurrencesOfString: @"{width}" withString:[NSString stringWithFormat:@"%d", (int)tileSize] options:0 range:NSMakeRange(0, url.length)];
    [url replaceOccurrencesOfString: @"{height}" withString:[NSString stringWithFormat:@"%d", (int)tileSize] options:0 range:NSMakeRange(0, url.length)];
    return [NSURL URLWithString:url];
}

+ (NSArray *)getBoundBox:(NSInteger)x yAxis:(NSInteger)y zoom:(NSInteger)zoom
{
    double MapX = -20037508.34789244;
    double MapY = 20037508.34789244;
    double FULL = 20037508.34789244 * 2;
    double tile = FULL / pow(2.0, (double)zoom);
    
    NSArray *result  =[[NSArray alloc] initWithObjects:
                       [NSNumber numberWithDouble:MapX + (double)x * tile],
                       [NSNumber numberWithDouble:MapY - (double)(y + 1) * tile],
                       [NSNumber numberWithDouble:MapX + (double)(x + 1) * tile],
                       [NSNumber numberWithDouble:MapY - (double)y * tile],
                       nil];
    
    return result;   
}

@end