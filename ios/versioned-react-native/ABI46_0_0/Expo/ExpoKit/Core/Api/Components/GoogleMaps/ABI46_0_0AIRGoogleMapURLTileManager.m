//
//  ABI46_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS

#import "ABI46_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI46_0_0AIRGoogleMapUrlTile.h"

@interface ABI46_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI46_0_0AIRGoogleMapUrlTileManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapUrlTile *tileLayer = [ABI46_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
