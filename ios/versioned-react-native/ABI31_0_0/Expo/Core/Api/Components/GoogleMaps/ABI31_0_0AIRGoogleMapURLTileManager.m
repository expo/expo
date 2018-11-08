//
//  ABI31_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI31_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI31_0_0AIRGoogleMapUrlTile.h"

@interface ABI31_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI31_0_0AIRGoogleMapUrlTileManager

ABI31_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI31_0_0AIRGoogleMapUrlTile *tileLayer = [ABI31_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)

@end
