//
//  AIRUrlTileOverlay.m
//  AirMaps
//
//  Created by cascadian on 3/19/16.
//  Copyright © 2016. All rights reserved.
//

#import "AIRMapUrlTile.h"
#import <React/UIView+React.h>
#import "AIRMapUrlTileCachedOverlay.h"

@implementation AIRMapUrlTile 

- (void)setShouldReplaceMapContent:(BOOL)shouldReplaceMapContent
{
    _shouldReplaceMapContent = shouldReplaceMapContent;
    if (self.tileOverlay) {
        self.tileOverlay.canReplaceMapContent = _shouldReplaceMapContent;
    }
    [self update];
}

- (void)setMaximumZ:(NSInteger)maximumZ
{
    _maximumZ = maximumZ;
    if (self.tileOverlay) {
        self.tileOverlay.maximumZ = _maximumZ;
    }
    [self update];
}

- (void)setMaximumNativeZ:(NSInteger)maximumNativeZ
{
    _maximumNativeZ = maximumNativeZ;
    _maximumNativeZSet = YES;
    if (_cachedOverlayCreated) {
        self.tileOverlay.maximumNativeZ = _maximumNativeZ;
    } else {
        [self createTileOverlayAndRendererIfPossible];
    }
    [self update];
}

- (void)setMinimumZ:(NSInteger)minimumZ
{
    _minimumZ = minimumZ;
    if (self.tileOverlay) {
        self.tileOverlay.minimumZ = _minimumZ;
    }
    [self update];
}

- (void)setFlipY:(BOOL)flipY
{
    _flipY = flipY;
    _flipYSet = YES;
    if (self.tileOverlay) {
        self.tileOverlay.geometryFlipped = _flipY;
    }
    [self update];
}

- (void)setUrlTemplate:(NSString *)urlTemplate
{
    _urlTemplate = urlTemplate;
    _urlTemplateSet = YES;
    [self createTileOverlayAndRendererIfPossible];
    [self update];
}

- (void)setTileSize:(NSInteger)tileSize
{
    _tileSize = tileSize;
    _tileSizeSet = YES;
    [self createTileOverlayAndRendererIfPossible];
    [self update];
}

- (void)setTileCachePath:(NSString *)tileCachePath{
    if (!tileCachePath) return;
    _tileCachePath = tileCachePath;
    _tileCachePathSet = YES;
    [self createTileOverlayAndRendererIfPossible];
    [self update];
}

- (void)setTileCacheMaxAge:(NSInteger)tileCacheMaxAge{
    _tileCacheMaxAge = tileCacheMaxAge;
    _tileCacheMaxAgeSet = YES;
    if (_cachedOverlayCreated) {
        self.tileOverlay.tileCacheMaxAge = _tileCacheMaxAge;
    } else {
        [self createTileOverlayAndRendererIfPossible];
    }
    [self update];
}

- (void)setOfflineMode:(BOOL)offlineMode
{
    _offlineMode = offlineMode;
    if (_cachedOverlayCreated) {
        self.tileOverlay.offlineMode = _offlineMode;
    }
    if (self.renderer) [self.renderer reloadData];
}

- (void)setOpacity:(CGFloat)opacity
{
    _opacity = opacity;
    _opacitySet = YES;
    if (self.renderer) {
        self.renderer.alpha = opacity;
    } else {
        [self createTileOverlayAndRendererIfPossible];
    }
    [self update];
}

- (void)createTileOverlayAndRendererIfPossible
{
    if (!_urlTemplateSet) return;
    if (_tileCachePathSet || _maximumNativeZSet) {
        NSLog(@"tileCache dir %@", _tileCachePath);
        self.tileOverlay = [[AIRMapUrlTileCachedOverlay alloc] initWithURLTemplate:self.urlTemplate];
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
        self.tileOverlay = [[MKTileOverlay alloc] initWithURLTemplate:self.urlTemplate];
        _cachedOverlayCreated = NO;
    }

    [self updateProperties];

    self.renderer = [[MKTileOverlayRenderer alloc] initWithTileOverlay:self.tileOverlay];
    if (_opacitySet) {
        self.renderer.alpha = self.opacity;
    }
}

- (void)updateProperties
{
    self.tileOverlay.canReplaceMapContent = self.shouldReplaceMapContent;

    if(self.minimumZ) {
        self.tileOverlay.minimumZ = self.minimumZ;
    }
    if (self.maximumZ) {
        self.tileOverlay.maximumZ = self.maximumZ;
    }
    if (_cachedOverlayCreated && self.maximumNativeZ) {
        self.tileOverlay.maximumNativeZ = self.maximumNativeZ;
    }
    if (_flipYSet) {
        self.tileOverlay.geometryFlipped = self.flipY;
    }
    if (_tileSizeSet) {
        self.tileOverlay.tileSize = CGSizeMake(self.tileSize, self.tileSize);
    }
    if (_cachedOverlayCreated && self.offlineMode) {
        self.tileOverlay.offlineMode = self.offlineMode;
    }
}

- (void)update
{
    if (!_renderer) return;
    
    if (_map == nil) return;
    [_map removeOverlay:self];
    [_map addOverlay:self level:MKOverlayLevelAboveLabels];
    for (id<MKOverlay> overlay in _map.overlays) {
        if ([overlay isKindOfClass:[AIRMapUrlTile class]]) {
            continue;
        }
        [_map removeOverlay:overlay];
        [_map addOverlay:overlay];
    }
}

#pragma mark MKOverlay implementation

- (CLLocationCoordinate2D)coordinate
{
    return self.tileOverlay.coordinate;
}

- (MKMapRect)boundingMapRect
{
    return self.tileOverlay.boundingMapRect;
}

- (BOOL)canReplaceMapContent
{
    return self.tileOverlay.canReplaceMapContent;
}

@end
