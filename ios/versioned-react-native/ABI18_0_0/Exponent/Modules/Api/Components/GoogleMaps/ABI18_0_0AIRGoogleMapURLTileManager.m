//
//  ABI18_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI18_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI18_0_0AIRGoogleMapUrlTile.h"

@interface ABI18_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI18_0_0AIRGoogleMapUrlTileManager

ABI18_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI18_0_0AIRGoogleMapUrlTile *tileLayer = [ABI18_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
