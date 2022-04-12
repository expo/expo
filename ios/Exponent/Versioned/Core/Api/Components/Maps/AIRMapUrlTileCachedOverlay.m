//
//  AIRMapUrlTileCachedOverlay.m
//  Airmaps
//
//  Created by Markus Suomi on 10/04/2021.
//

#import "AIRMapUrlTileCachedOverlay.h"

@interface AIRMapUrlTileCachedOverlay ()

@end

@implementation AIRMapUrlTileCachedOverlay {
    CIContext *_ciContext;
    CGColorSpaceRef _colorspace;
    NSURLSession *_urlSession;
}

- (void)loadTileAtPath:(MKTileOverlayPath)path result:(void (^)(NSData *, NSError *))result
{
    if (!result) return;

    NSInteger maximumZ = self.maximumNativeZ ? self.maximumNativeZ : path.z;
    [self scaleIfNeededLowerZoomTile:path maximumZ:maximumZ result:^(NSData *image, NSError *error) {
        if (!image && self.offlineMode && self.tileCachePath) {
            NSInteger zoomLevelToStart = (path.z > maximumZ) ? maximumZ - 1 : path.z - 1; 
            NSInteger minimumZoomToSearch = self.minimumZ >= zoomLevelToStart - 3 ? self.minimumZ : zoomLevelToStart - 3;
            [self findLowerZoomTileAndScale:path tryZ:zoomLevelToStart minZ:minimumZoomToSearch result:result];
        } else {
            result(image, error);
        }    
    }];
}

- (void)scaleIfNeededLowerZoomTile:(MKTileOverlayPath)path maximumZ:(NSInteger)maximumZ result:(void (^)(NSData *, NSError *))result
{
    NSInteger overZoomLevel = path.z - maximumZ;
    if (overZoomLevel <= 0) {
        [self getTileImage:path result:result];
        return;
    }

    NSInteger zoomFactor = 1 << overZoomLevel;
    
    MKTileOverlayPath parentTile;
    parentTile.x = path.x >> overZoomLevel;
    parentTile.y = path.y >> overZoomLevel;
    parentTile.z = path.z - overZoomLevel;
    parentTile.contentScaleFactor = path.contentScaleFactor;
    
    NSInteger xOffset = path.x % zoomFactor;
    NSInteger yOffset = path.y % zoomFactor;
    NSInteger subTileSize = self.tileSize.width / zoomFactor;

    if (!_ciContext) _ciContext = [CIContext context];
    if (!_colorspace) _colorspace = CGColorSpaceCreateDeviceRGB();

    [self getTileImage:parentTile result:^(NSData *image, NSError *error) {
        if (!image) {
            result(nil, nil);
            return;
        }

        CIImage* originalCIImage = [CIImage imageWithData:image];

        CGRect rect;
        rect.origin.x = xOffset * subTileSize;
        rect.origin.y = self.tileSize.width - (yOffset + 1) * subTileSize;
        rect.size.width = subTileSize;
        rect.size.height = subTileSize;
        CIVector *inputRect = [CIVector vectorWithCGRect:rect];
        CIFilter* cropFilter = [CIFilter filterWithName:@"CICrop"];
        [cropFilter setValue:originalCIImage forKey:@"inputImage"];
        [cropFilter setValue:inputRect forKey:@"inputRectangle"];

        CGAffineTransform trans = CGAffineTransformMakeScale(zoomFactor, zoomFactor);
        CIImage* scaledCIImage = [cropFilter.outputImage imageByApplyingTransform:trans];

        NSData *finalImage = [_ciContext PNGRepresentationOfImage:scaledCIImage format:kCIFormatABGR8 colorSpace:_colorspace options:nil];
        result(finalImage, nil);
    }];    
}

- (void)findLowerZoomTileAndScale:(MKTileOverlayPath)path tryZ:(NSInteger)tryZ minZ:(NSInteger)minZ result:(void (^)(NSData *, NSError *))result
{
    [self scaleIfNeededLowerZoomTile:path maximumZ:tryZ result:^(NSData *image, NSError *error) {
        if (image) {
            result(image, error);
        } else if (tryZ >= minZ) {
            [self findLowerZoomTileAndScale:path tryZ:tryZ - 1 minZ:minZ result:result];
        } else {
            result(nil, nil);
        }
    }];
}

- (void)getTileImage:(MKTileOverlayPath)path result:(void (^)(NSData *, NSError *))result
{
    NSData *image;
    NSURL *tileCacheFileDirectory = [NSURL URLWithString:[NSString stringWithFormat:@"%d/%d/", (int)path.z, (int)path.x] relativeToURL:self.tileCachePath];
    NSURL *tileCacheFilePath = [NSURL URLWithString:[NSString stringWithFormat:@"%d", (int)path.y] relativeToURL:tileCacheFileDirectory];

    if (self.tileCachePath) {
        image = [self readTileImage:path fromFilePath:tileCacheFilePath];
        if (image) {
            result(image, nil);
            if (!self.offlineMode && self.tileCacheMaxAge) {
                [self checkForRefresh:path fromFilePath:tileCacheFilePath];
            }
        }
    }

    if (!image) {
        if (!self.offlineMode) {
            [self fetchTile:path result:^(NSData *image, NSError *error) {
                result(image, error);
                if (image && self.tileCachePath) {
                    [self writeTileImage:tileCacheFileDirectory withTileCacheFilePath:tileCacheFilePath withTileData:image];
                }
            }];
        } else {
            result(nil, nil);
        }
    }
}

- (NSData *)readTileImage:(MKTileOverlayPath)path fromFilePath:(NSURL *)tileCacheFilePath
{
    NSError *error;

    if ([[NSFileManager defaultManager] fileExistsAtPath:[tileCacheFilePath path]]) {
        if (!self.tileCacheMaxAge) {
            [[NSFileManager defaultManager] setAttributes:@{NSFileModificationDate:[NSDate date]}
                            ofItemAtPath:[tileCacheFilePath path]
                                    error:&error];
        }

        NSData *tile = [NSData dataWithContentsOfFile:[tileCacheFilePath path]];
        NSLog(@"tileCache HIT for %d_%d_%d", (int)path.z, (int)path.x, (int)path.y);
        NSLog(@"tileCache HIT, with max age set at %d", self.tileCacheMaxAge);
        return tile;
    } else {
        NSLog(@"tileCache MISS for %d_%d_%d", (int)path.z, (int)path.x, (int)path.y);
        return nil;
    }
}

- (void)fetchTile:(MKTileOverlayPath)path result:(void (^)(NSData *, NSError *))result
{
    if (!_urlSession) [self createURLSession];

    [[_urlSession dataTaskWithURL:[self URLForTilePath:path]
        completionHandler:^(NSData *data,
                            NSURLResponse *response,
                            NSError *error) {
            result(data, error);
        }] resume];
}

- (void)writeTileImage:(NSURL *)tileCacheFileDirectory withTileCacheFilePath:(NSURL *)tileCacheFilePath withTileData:(NSData *)data
{
    NSError *error;
    
    if (![[NSFileManager defaultManager] fileExistsAtPath:[tileCacheFileDirectory path]]) {
        [[NSFileManager defaultManager] createDirectoryAtPath:[tileCacheFileDirectory path] withIntermediateDirectories:YES attributes:nil error:&error];
        if (error) {
            NSLog(@"Error: %@", error);
            return;
        }
    }

    [[NSFileManager defaultManager] createFileAtPath:[tileCacheFilePath path] contents:data attributes:nil];
    NSLog(@"tileCache SAVED tile %@", [tileCacheFilePath path]);
}

- (void)createTileCacheDirectory
{
    NSError *error;
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    NSString *documentsDirectory = [paths objectAtIndex:0];
    NSString *tileCacheBaseDirectory = [NSString stringWithFormat:@"%@/tileCache", documentsDirectory];
    self.tileCachePath = [NSURL fileURLWithPath:tileCacheBaseDirectory isDirectory:YES];
    
    if (![[NSFileManager defaultManager] fileExistsAtPath:[self.tileCachePath path]])
        [[NSFileManager defaultManager] createDirectoryAtPath:[self.tileCachePath path] withIntermediateDirectories:NO attributes:nil error:&error];
}

- (void)createURLSession
{
 if (!_urlSession) {
     _urlSession = [NSURLSession sharedSession];
 }
}

- (void)checkForRefresh:(MKTileOverlayPath)path fromFilePath:(NSURL *)tileCacheFilePath
{
    if ([self doesFileNeedRefresh:path fromFilePath:tileCacheFilePath withMaxAge:self.tileCacheMaxAge]) {
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^ {
            // This code runs asynchronously!
            if ([self doesFileNeedRefresh:path fromFilePath:tileCacheFilePath withMaxAge:self.tileCacheMaxAge]) {
                if (!_urlSession) [self createURLSession];

                [[_urlSession dataTaskWithURL:[self URLForTilePath:path]
                    completionHandler:^(NSData *data,
                                        NSURLResponse *response,
                                        NSError *error) {
                    if (!error) {
                        [[NSFileManager defaultManager] createFileAtPath:[tileCacheFilePath path] contents:data attributes:nil];
                        NSLog(@"tileCache File refreshed at %@", [tileCacheFilePath path]);
                    }
                }] resume];             
            }
        });
    }
}

- (BOOL)doesFileNeedRefresh:(MKTileOverlayPath)path fromFilePath:(NSURL *)tileCacheFilePath withMaxAge:(NSInteger)tileCacheMaxAge
{
    NSError *error;
    NSDictionary<NSFileAttributeKey, id> *fileAttributes = [[NSFileManager defaultManager] attributesOfItemAtPath:[tileCacheFilePath path] error:&error]; 

    if (fileAttributes) {
        NSDate *modificationDate = fileAttributes[@"NSFileModificationDate"];
        if (modificationDate) {
            if (-1 * (int)modificationDate.timeIntervalSinceNow > tileCacheMaxAge) {
                return YES;
            }
        }
    }

    return NO;
}

@end
