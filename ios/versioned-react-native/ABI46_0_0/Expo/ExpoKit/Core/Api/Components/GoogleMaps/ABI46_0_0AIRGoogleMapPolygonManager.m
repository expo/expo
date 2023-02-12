//
//  ABI46_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI46_0_0HAVE_GOOGLE_MAPS
#import "ABI46_0_0AIRGoogleMapPolygonManager.h"

#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert+CoreLocation.h>
#import <ABI46_0_0React/ABI46_0_0RCTEventDispatcher.h>
#import <ABI46_0_0React/ABI46_0_0RCTViewManager.h>
#import <ABI46_0_0React/ABI46_0_0UIView+React.h>
#import "ABI46_0_0RCTConvert+AirMap.h"
#import "ABI46_0_0AIRGoogleMapPolygon.h"

@interface ABI46_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI46_0_0AIRGoogleMapPolygonManager

ABI46_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI46_0_0AIRGoogleMapPolygon *polygon = [ABI46_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI46_0_0AIRMapCoordinateArray)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI46_0_0AIRMapCoordinateArrayArray)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI46_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI46_0_0RCTBubblingEventBlock)

@end

#endif
