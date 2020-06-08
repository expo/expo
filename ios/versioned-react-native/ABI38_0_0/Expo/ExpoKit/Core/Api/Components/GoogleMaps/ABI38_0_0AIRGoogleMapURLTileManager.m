//
//  ABI38_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI38_0_0AIRGoogleMapUrlTile.h"

@interface ABI38_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI38_0_0AIRGoogleMapUrlTileManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapUrlTile *tileLayer = [ABI38_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
