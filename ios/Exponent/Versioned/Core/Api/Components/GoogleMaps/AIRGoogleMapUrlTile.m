//
//  AIRGoogleMapURLTile.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMapUrlTile.h"

@implementation AIRGoogleMapUrlTile

- (void)setZIndex:(int)zIndex
{
  _zIndex = zIndex;
  _tileLayer.zIndex = zIndex;
}

- (void)setUrlTemplate:(NSString *)urlTemplate
{
  _urlTemplate = urlTemplate;
  _tileLayer = [GMSURLTileLayer tileLayerWithURLConstructor:[self _getTileURLConstructor]];
  _tileLayer.tileSize = [[UIScreen mainScreen] scale] * 256;
}

- (GMSTileURLConstructor)_getTileURLConstructor
{
  NSString *urlTemplate = self.urlTemplate;
  NSInteger *maximumZ = self.maximumZ;
  NSInteger *minimumZ = self.minimumZ;
  GMSTileURLConstructor urls = ^NSURL* _Nullable (NSUInteger x, NSUInteger y, NSUInteger zoom) {
    
    if (self.flipY == YES) {
      y = (1 << zoom) - y - 1;
    }
    
    NSString *url = urlTemplate;
    url = [url stringByReplacingOccurrencesOfString:@"{x}" withString:[NSString stringWithFormat: @"%ld", (long)x]];
    url = [url stringByReplacingOccurrencesOfString:@"{y}" withString:[NSString stringWithFormat: @"%ld", (long)y]];
    url = [url stringByReplacingOccurrencesOfString:@"{z}" withString:[NSString stringWithFormat: @"%ld", (long)zoom]];

   if(maximumZ && (long)zoom > (long)maximumZ) {
      return nil;
    }

    if(minimumZ && (long)zoom < (long)minimumZ) {
      return nil;
    }

    return [NSURL URLWithString:url];
  };
  return urls;
}

@end

#endif
