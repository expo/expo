//
//  ABI15_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI15_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI15_0_0AIRGoogleMapUrlTile.h"

@interface ABI15_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI15_0_0AIRGoogleMapUrlTileManager

ABI15_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI15_0_0AIRGoogleMapUrlTile *tileLayer = [ABI15_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
