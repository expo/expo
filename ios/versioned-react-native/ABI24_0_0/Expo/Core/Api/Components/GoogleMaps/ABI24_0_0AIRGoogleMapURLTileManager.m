//
//  ABI24_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI24_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI24_0_0AIRGoogleMapUrlTile.h"

@interface ABI24_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI24_0_0AIRGoogleMapUrlTileManager

ABI24_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI24_0_0AIRGoogleMapUrlTile *tileLayer = [ABI24_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
