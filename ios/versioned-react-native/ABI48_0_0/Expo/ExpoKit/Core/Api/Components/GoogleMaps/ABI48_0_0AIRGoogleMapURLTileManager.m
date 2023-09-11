//
//  ABI48_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS

#import "ABI48_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI48_0_0AIRGoogleMapUrlTile.h"

@interface ABI48_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI48_0_0AIRGoogleMapUrlTileManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapUrlTile *tileLayer = [ABI48_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
