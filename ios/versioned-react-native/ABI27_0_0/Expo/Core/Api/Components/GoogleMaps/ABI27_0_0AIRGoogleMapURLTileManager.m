//
//  ABI27_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI27_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI27_0_0AIRGoogleMapUrlTile.h"

@interface ABI27_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI27_0_0AIRGoogleMapUrlTileManager

ABI27_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI27_0_0AIRGoogleMapUrlTile *tileLayer = [ABI27_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
