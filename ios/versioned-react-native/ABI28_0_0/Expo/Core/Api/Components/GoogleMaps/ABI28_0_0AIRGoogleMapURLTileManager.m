//
//  ABI28_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI28_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI28_0_0AIRGoogleMapUrlTile.h"

@interface ABI28_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI28_0_0AIRGoogleMapUrlTileManager

ABI28_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI28_0_0AIRGoogleMapUrlTile *tileLayer = [ABI28_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
