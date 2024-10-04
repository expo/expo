//
//  ABI42_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS

#import "ABI42_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI42_0_0AIRGoogleMapUrlTile.h"

@interface ABI42_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI42_0_0AIRGoogleMapUrlTileManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapUrlTile *tileLayer = [ABI42_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
