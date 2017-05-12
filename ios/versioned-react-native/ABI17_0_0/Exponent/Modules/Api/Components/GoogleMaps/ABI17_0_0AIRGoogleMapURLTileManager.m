//
//  ABI17_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI17_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI17_0_0AIRGoogleMapUrlTile.h"

@interface ABI17_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI17_0_0AIRGoogleMapUrlTileManager

ABI17_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI17_0_0AIRGoogleMapUrlTile *tileLayer = [ABI17_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
