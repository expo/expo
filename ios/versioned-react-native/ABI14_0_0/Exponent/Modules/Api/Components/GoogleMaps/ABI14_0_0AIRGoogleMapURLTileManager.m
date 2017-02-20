//
//  ABI14_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI14_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI14_0_0AIRGoogleMapUrlTile.h"

@interface ABI14_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI14_0_0AIRGoogleMapUrlTileManager

ABI14_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI14_0_0AIRGoogleMapUrlTile *tileLayer = [ABI14_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
