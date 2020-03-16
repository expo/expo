//
//  ABI37_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI37_0_0HAVE_GOOGLE_MAPS
#import "ABI37_0_0AIRGoogleMapPolygonManager.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert+CoreLocation.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTViewManager.h>
#import <ABI37_0_0React/ABI37_0_0UIView+React.h>
#import "ABI37_0_0RCTConvert+AirMap.h"
#import "ABI37_0_0AIRGoogleMapPolygon.h"

@interface ABI37_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI37_0_0AIRGoogleMapPolygonManager

ABI37_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI37_0_0AIRGoogleMapPolygon *polygon = [ABI37_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI37_0_0AIRMapCoordinateArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI37_0_0AIRMapCoordinateArrayArray)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI37_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI37_0_0RCTBubblingEventBlock)

@end

#endif
