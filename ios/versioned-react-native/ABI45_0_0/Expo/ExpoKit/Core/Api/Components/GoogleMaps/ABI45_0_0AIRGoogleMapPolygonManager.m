//
//  ABI45_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI45_0_0HAVE_GOOGLE_MAPS
#import "ABI45_0_0AIRGoogleMapPolygonManager.h"

#import <ABI45_0_0React/ABI45_0_0RCTBridge.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert.h>
#import <ABI45_0_0React/ABI45_0_0RCTConvert+CoreLocation.h>
#import <ABI45_0_0React/ABI45_0_0RCTEventDispatcher.h>
#import <ABI45_0_0React/ABI45_0_0RCTViewManager.h>
#import <ABI45_0_0React/ABI45_0_0UIView+React.h>
#import "ABI45_0_0RCTConvert+AirMap.h"
#import "ABI45_0_0AIRGoogleMapPolygon.h"

@interface ABI45_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI45_0_0AIRGoogleMapPolygonManager

ABI45_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI45_0_0AIRGoogleMapPolygon *polygon = [ABI45_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI45_0_0AIRMapCoordinateArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI45_0_0AIRMapCoordinateArrayArray)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI45_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI45_0_0RCTBubblingEventBlock)

@end

#endif
