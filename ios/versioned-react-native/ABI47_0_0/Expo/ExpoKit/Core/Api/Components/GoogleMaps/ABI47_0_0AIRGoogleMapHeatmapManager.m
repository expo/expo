//
//  ABI47_0_0AIRGoogleMapHeatmapManager.m
//
//  Created by David Cako on 29 April 2018.
//

#import "ABI47_0_0AIRGoogleMapHeatmapManager.h"
#import "ABI47_0_0AIRGoogleMapHeatmap.h"
#import "ABI47_0_0AIRGoogleMap.h"
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0UIView+React.h>

@interface ABI47_0_0AIRGoogleMapHeatmapManager()

@end

@implementation ABI47_0_0AIRGoogleMapHeatmapManager

ABI47_0_0RCT_EXPORT_MODULE()

- (UIView *)view
{
  ABI47_0_0AIRGoogleMapHeatmap *heatmap = [ABI47_0_0AIRGoogleMapHeatmap new];
  return heatmap;
}

ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(points, NSArray<NSDictionary *>)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(radius, NSUInteger)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(opacity, float)
ABI47_0_0RCT_EXPORT_VIEW_PROPERTY(gradient, NSDictionary *)

@end