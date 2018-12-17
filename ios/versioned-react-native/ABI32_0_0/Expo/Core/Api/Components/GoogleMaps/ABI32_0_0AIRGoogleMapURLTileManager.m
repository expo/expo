//
//  ABI32_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI32_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI32_0_0AIRGoogleMapUrlTile.h"

@interface ABI32_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI32_0_0AIRGoogleMapUrlTileManager

ABI32_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI32_0_0AIRGoogleMapUrlTile *tileLayer = [ABI32_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)

@end
