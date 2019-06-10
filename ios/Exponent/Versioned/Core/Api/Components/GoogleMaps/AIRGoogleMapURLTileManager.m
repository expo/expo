//
//  AIRGoogleMapURLTileManager.m
//  Created by Nick Italiano on 11/5/16.
//

#ifdef HAVE_GOOGLE_MAPS

#import "AIRGoogleMapUrlTileManager.h"
#import "AIRGoogleMapUrlTile.h"

@interface AIRGoogleMapUrlTileManager()

@end

@implementation AIRGoogleMapUrlTileManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  AIRGoogleMapUrlTile *tileLayer = [AIRGoogleMapUrlTile new];
  return tileLayer;
}

RCT_EXPORT_VIEW_PROPERTY(urlTemplate, NSString)
RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
RCT_EXPORT_VIEW_PROPERTY(maximumZ, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(minimumZ, NSInteger)
RCT_EXPORT_VIEW_PROPERTY(flipY, BOOL)

@end

#endif
