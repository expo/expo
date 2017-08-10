//
//  ABI20_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI20_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI20_0_0AIRGoogleMapUrlTile.h"

@interface ABI20_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI20_0_0AIRGoogleMapUrlTileManager

ABI20_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI20_0_0AIRGoogleMapUrlTile *tileLayer = [ABI20_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
