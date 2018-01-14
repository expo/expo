//
//  ABI25_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI25_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI25_0_0AIRGoogleMapUrlTile.h"

@interface ABI25_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI25_0_0AIRGoogleMapUrlTileManager

ABI25_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI25_0_0AIRGoogleMapUrlTile *tileLayer = [ABI25_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI25_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
