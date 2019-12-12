//
//  ABI36_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS

#import "ABI36_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI36_0_0AIRGoogleMapUrlTile.h"

@interface ABI36_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI36_0_0AIRGoogleMapUrlTileManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapUrlTile *tileLayer = [ABI36_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
