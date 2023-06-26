//
//  ABI49_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI49_0_0HAVE_GOOGLE_MAPS

#import "ABI49_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI49_0_0AIRGoogleMapUrlTile.h"

@interface ABI49_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI49_0_0AIRGoogleMapUrlTileManager

ABI49_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI49_0_0AIRGoogleMapUrlTile *tileLayer = [ABI49_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
