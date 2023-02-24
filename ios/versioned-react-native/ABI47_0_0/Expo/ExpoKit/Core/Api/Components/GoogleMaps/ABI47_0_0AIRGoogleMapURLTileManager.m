//
//  ABI47_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import "ABI47_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI47_0_0AIRGoogleMapUrlTile.h"

@interface ABI47_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI47_0_0AIRGoogleMapUrlTileManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapUrlTile *tileLayer = [ABI47_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
