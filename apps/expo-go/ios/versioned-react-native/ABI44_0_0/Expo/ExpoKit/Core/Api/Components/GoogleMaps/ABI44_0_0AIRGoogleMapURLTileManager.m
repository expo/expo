//
//  ABI44_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI44_0_0HAVE_GOOGLE_MAPS

#import "ABI44_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI44_0_0AIRGoogleMapUrlTile.h"

@interface ABI44_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI44_0_0AIRGoogleMapUrlTileManager

ABI44_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI44_0_0AIRGoogleMapUrlTile *tileLayer = [ABI44_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI44_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
