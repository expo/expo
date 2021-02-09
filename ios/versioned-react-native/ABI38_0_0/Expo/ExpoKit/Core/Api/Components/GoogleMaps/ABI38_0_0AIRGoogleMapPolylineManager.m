//
//  ABI38_0_0AIRGoogleMapPolylineManager.m
//
//  Created by Nick Italiano on 10/22/16.
//

#ifdef ABI38_0_0HAVE_GOOGLE_MAPS

#import "ABI38_0_0AIRGoogleMapPolylineManager.h"

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert+CoreLocation.h>
#import <ABI38_0_0React/ABI38_0_0RCTEventDispatcher.h>
#import <ABI38_0_0React/ABI38_0_0RCTViewManager.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>
#import "ABI38_0_0RCTConvert+AirMap.h"
#import "ABI38_0_0AIRGoogleMapPolyline.h"

@interface ABI38_0_0AIRGoogleMapPolylineManager()

@end

@implementation ABI38_0_0AIRGoogleMapPolylineManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapPolyline *polyline = [ABI38_0_0AIRGoogleMapPolyline new];
  polyline.bridge = self.bridge;
  return polyline;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(coordinates, ABI38_0_0AIRMapCoordinateArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(fillColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColor, UIColor)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeColors, UIColorArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(strokeWidth, double)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(lineDashPattern, NSArray)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(geodesic, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(zIndex, int)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tappable, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(onPress, ABI38_0_0RCTBubblingEventBlock)

@end

#endif
