//
//  ABI29_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#import "ABI29_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI29_0_0AIRGoogleMapUrlTile.h"

@interface ABI29_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI29_0_0AIRGoogleMapUrlTileManager

ABI29_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI29_0_0AIRGoogleMapUrlTile *tileLayer = [ABI29_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)

@end
