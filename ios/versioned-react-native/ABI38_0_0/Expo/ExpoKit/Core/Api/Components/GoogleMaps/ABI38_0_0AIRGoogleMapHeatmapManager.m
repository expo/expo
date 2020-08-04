//
//  ABI38_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI38_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI38_0_0AIRGoogleMapHeatmap.h"
#import "ABI38_0_0AIRGoogleMap.h"
#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>
#import <ABI38_0_0React/ABI38_0_0UIView+React.h>

@interface ABI38_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI38_0_0AIRGoogleMapHeatmapManager

ABI38_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI38_0_0AIRGoogleMapHeatmap *heatmap = [ABI38_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
