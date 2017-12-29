//
//  ABI21_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI21_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI21_0_0AIRGoogleMapUrlTile.h"

@interface ABI21_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI21_0_0AIRGoogleMapUrlTileManager

ABI21_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI21_0_0AIRGoogleMapUrlTile *tileLayer = [ABI21_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
