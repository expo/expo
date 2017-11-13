//
//  ABI23_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI23_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI23_0_0AIRGoogleMapUrlTile.h"

@interface ABI23_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI23_0_0AIRGoogleMapUrlTileManager

ABI23_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI23_0_0AIRGoogleMapUrlTile *tileLayer = [ABI23_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
