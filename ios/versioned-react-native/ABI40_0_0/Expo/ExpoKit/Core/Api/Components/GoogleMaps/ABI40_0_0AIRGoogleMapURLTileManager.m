//
//  ABI40_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI40_0_0HAVE_GOOGLE_MAPS

#import "ABI40_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI40_0_0AIRGoogleMapUrlTile.h"

@interface ABI40_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI40_0_0AIRGoogleMapUrlTileManager

ABI40_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI40_0_0AIRGoogleMapUrlTile *tileLayer = [ABI40_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI40_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
