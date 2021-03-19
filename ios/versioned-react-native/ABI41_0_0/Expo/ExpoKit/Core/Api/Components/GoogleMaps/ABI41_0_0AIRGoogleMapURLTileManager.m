//
//  ABI41_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI41_0_0HAVE_GOOGLE_MAPS

#import "ABI41_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI41_0_0AIRGoogleMapUrlTile.h"

@interface ABI41_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI41_0_0AIRGoogleMapUrlTileManager

ABI41_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI41_0_0AIRGoogleMapUrlTile *tileLayer = [ABI41_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI41_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
