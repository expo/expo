//
//  ABI43_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI43_0_0HAVE_GOOGLE_MAPS

#import "ABI43_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI43_0_0AIRGoogleMapUrlTile.h"

@interface ABI43_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI43_0_0AIRGoogleMapUrlTileManager

ABI43_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI43_0_0AIRGoogleMapUrlTile *tileLayer = [ABI43_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI43_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
