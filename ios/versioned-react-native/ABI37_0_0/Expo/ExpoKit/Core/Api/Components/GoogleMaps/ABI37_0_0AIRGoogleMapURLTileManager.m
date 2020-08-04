//
//  ABI37_0_0AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS

#import "ABI37_0_0AIRGoogleMapUrlTileManager.h"
#import "ABI37_0_0AIRGoogleMapUrlTile.h"

@interface ABI37_0_0AIRGoogleMapUrlTileManager()

@end

@implementation ABI37_0_0AIRGoogleMapUrlTileManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapUrlTile *tileLayer = [ABI37_0_0AIRGoogleMapUrlTile new];
  return tileLayer;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
