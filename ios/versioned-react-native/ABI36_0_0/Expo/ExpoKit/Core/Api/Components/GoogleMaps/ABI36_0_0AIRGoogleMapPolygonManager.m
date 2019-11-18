//
//  ABI36_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI36_0_0HAVE_GOOGLE_MAPS
#import "ABI36_0_0AIRGoogleMapPolygonManager.h"

#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert.h>
#import <ABI36_0_0React/ABI36_0_0RCTConvert+CoreLocation.h>
#import <ABI36_0_0React/ABI36_0_0RCTEventDispatcher.h>
#import <ABI36_0_0React/ABI36_0_0RCTViewManager.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>
#import "ABI36_0_0RCTConvert+AirMap.h"
#import "ABI36_0_0AIRGoogleMapPolygon.h"

@interface ABI36_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI36_0_0AIRGoogleMapPolygonManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapPolygon *polygon = [ABI36_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI36_0_0AIRMapCoordinateArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI36_0_0AIRMapCoordinateArrayArray)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI36_0_0RCTBubblingEventBlock)

@end

#endif
