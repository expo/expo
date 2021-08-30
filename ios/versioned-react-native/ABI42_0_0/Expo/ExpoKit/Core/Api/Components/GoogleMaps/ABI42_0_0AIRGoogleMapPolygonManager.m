//
//  ABI42_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI42_0_0HAVE_GOOGLE_MAPS
#import "ABI42_0_0AIRGoogleMapPolygonManager.h"

#import <ABI42_0_0React/ABI42_0_0RCTBridge.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTConvert+CoreLocation.h>
#import <ABI42_0_0React/ABI42_0_0RCTEventDispatcher.h>
#import <ABI42_0_0React/ABI42_0_0RCTViewManager.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0RCTConvert+AirMap.h"
#import "ABI42_0_0AIRGoogleMapPolygon.h"

@interface ABI42_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI42_0_0AIRGoogleMapPolygonManager

ABI42_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI42_0_0AIRGoogleMapPolygon *polygon = [ABI42_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI42_0_0AIRMapCoordinateArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI42_0_0AIRMapCoordinateArrayArray)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI42_0_0RCTBubblingEventBlock)

@end

#endif
