//
//  ABI36_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI36_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI36_0_0AIRGoogleMapHeatmap.h"
#import "ABI36_0_0AIRGoogleMap.h"
#import <ABI36_0_0React/ABI36_0_0RCTBridge.h>
#import <ABI36_0_0React/ABI36_0_0UIView+React.h>

@interface ABI36_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI36_0_0AIRGoogleMapHeatmapManager

ABI36_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI36_0_0AIRGoogleMapHeatmap *heatmap = [ABI36_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI36_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end
