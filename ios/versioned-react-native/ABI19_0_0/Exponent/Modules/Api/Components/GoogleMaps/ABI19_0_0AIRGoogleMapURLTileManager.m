//
//  ABI19_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI19_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI19_0_0AIRGoogleMapUrlTile.h"

@interface ABI19_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI19_0_0AIRGoogleMapUrlTileManager

ABI19_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI19_0_0AIRGoogleMapUrlTile *tileLayer = [ABI19_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
