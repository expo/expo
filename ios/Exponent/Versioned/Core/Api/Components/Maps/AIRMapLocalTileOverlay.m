//
//  AIRMapLocalTileOverlay.m
//  Pods-AirMapsExplorer
//
//  Created by Peter Zavadsky on 04/12/2017.
//

#import "AIRMapLocalTileOverlay.h"

@interface AIRMapLocalTileOverlay ()

@end

@implementation AIRMapLocalTileOverlay


-(void)loadTileAtPath:(MKTileOverlayPath)path result:(void (^)(NSData *, NSError *))result {
    NSMutableString *tileFilePath = [self.URLTemplate mutableCopy];
    [tileFilePath replaceOccurrencesOfString: @"{x}" withString:[NSString stringWithFormat:@"%i", path.x] options:NULL range:NSMakeRange(0, tileFilePath.length)];
    [tileFilePath replaceOccurrencesOfString:@"{y}" withString:[NSString stringWithFormat:@"%i", path.y] options:NULL range:NSMakeRange(0, tileFilePath.length)];
    [tileFilePath replaceOccurrencesOfString:@"{z}" withString:[NSString stringWithFormat:@"%i", path.z] options:NULL range:NSMakeRange(0, tileFilePath.length)];
    if ([[NSFileManager defaultManager] fileExistsAtPath:tileFilePath]) {
        NSData* tile = [NSData dataWithContentsOfFile:tileFilePath];
        result(tile,nil);
    } else {
        result(nil, nil);
    }
}


@end
