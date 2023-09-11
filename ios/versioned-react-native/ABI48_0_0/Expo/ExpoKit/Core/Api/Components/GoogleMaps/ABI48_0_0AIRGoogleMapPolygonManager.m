//
//  ABI48_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI48_0_0HAVE_GOOGLE_MAPS
#import "ABI48_0_0AIRGoogleMapPolygonManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>
#import <ABI48_0_0React/ABI48_0_0RCTConvert+CoreLocation.h>
#import <ABI48_0_0React/ABI48_0_0RCTEventDispatcher.h>
#import <ABI48_0_0React/ABI48_0_0RCTViewManager.h>
#import <ABI48_0_0React/ABI48_0_0UIView+React.h>
#import "ABI48_0_0RCTConvert+AirMap.h"
#import "ABI48_0_0AIRGoogleMapPolygon.h"

@interface ABI48_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI48_0_0AIRGoogleMapPolygonManager

ABI48_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI48_0_0AIRGoogleMapPolygon *polygon = [ABI48_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI48_0_0AIRMapCoordinateArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI48_0_0AIRMapCoordinateArrayArray)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI48_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI48_0_0RCTBubblingEventBlock)

@end

#endif
