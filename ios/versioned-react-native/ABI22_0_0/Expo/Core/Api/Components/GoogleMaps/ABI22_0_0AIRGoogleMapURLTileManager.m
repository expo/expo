//
//  ABI22_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI22_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI22_0_0AIRGoogleMapUrlTile.h"

@interface ABI22_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI22_0_0AIRGoogleMapUrlTileManager

ABI22_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI22_0_0AIRGoogleMapUrlTile *tileLayer = [ABI22_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
