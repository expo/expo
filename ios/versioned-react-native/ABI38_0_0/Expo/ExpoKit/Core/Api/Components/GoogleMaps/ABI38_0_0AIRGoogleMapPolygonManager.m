//
//  ABI38_0_0AIRGoogleMapPolylgoneManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS
#import "ABI38_0_0AIRGoogleMapPolygonManager.h"

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert+CoreLocation.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>
#import "ABI38_0_0RCTConvert+AirMap.h"
#import "ABI38_0_0AIRGoogleMapPolygon.h"

@interface ABI38_0_0AIRGoogleMapPolygonManager()

@end

@implementation ABI38_0_0AIRGoogleMapPolygonManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapPolygon *polygon = [ABI38_0_0AIRGoogleMapPolygon new];
  polygon.bridge = self.bridge;
  return polygon;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI38_0_0AIRMapCoordinateArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(holes, ABI38_0_0AIRMapCoordinateArrayArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)

@end

#endif
