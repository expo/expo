//
//  ABI26_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI26_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI26_0_0AIRGoogleMapUrlTile.h"

@interface ABI26_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI26_0_0AIRGoogleMapUrlTileManager

ABI26_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI26_0_0AIRGoogleMapUrlTile *tileLayer = [ABI26_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
