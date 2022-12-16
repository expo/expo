//
//  ABI45_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS

#import "ABI45_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI45_0_0AIRGoogleMapUrlTile.h"

@interface ABI45_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI45_0_0AIRGoogleMapUrlTileManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapUrlTile *tileLayer = [ABI45_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
