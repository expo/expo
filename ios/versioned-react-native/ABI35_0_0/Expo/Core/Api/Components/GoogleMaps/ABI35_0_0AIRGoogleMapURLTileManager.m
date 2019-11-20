//
//  ABI35_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI35_0_0HAVE_GOOGLE_MAPS

#import "ABI35_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI35_0_0AIRGoogleMapUrlTile.h"

@interface ABI35_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI35_0_0AIRGoogleMapUrlTileManager

ABI35_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI35_0_0AIRGoogleMapUrlTile *tileLayer = [ABI35_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
