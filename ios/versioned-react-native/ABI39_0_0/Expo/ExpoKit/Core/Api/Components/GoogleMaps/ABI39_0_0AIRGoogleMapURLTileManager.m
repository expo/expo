//
//  ABI39_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI39_0_0HAVE_GOOGLE_MAPS

#import "ABI39_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI39_0_0AIRGoogleMapUrlTile.h"

@interface ABI39_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI39_0_0AIRGoogleMapUrlTileManager

ABI39_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI39_0_0AIRGoogleMapUrlTile *tileLayer = [ABI39_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI39_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
