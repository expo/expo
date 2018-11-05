//
//  ABI30_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI30_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI30_0_0AIRGoogleMapUrlTile.h"

@interface ABI30_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI30_0_0AIRGoogleMapUrlTileManager

ABI30_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI30_0_0AIRGoogleMapUrlTile *tileLayer = [ABI30_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
