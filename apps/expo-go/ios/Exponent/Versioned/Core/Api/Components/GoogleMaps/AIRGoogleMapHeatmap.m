//
//  AIRGoogleMapHeatmap.m
//
//  Created by David Cako on 29 April 2018.
//
#import <UIKit/UIKit.h>
#import "AIRGoogleMapHeatmap.h"
#import <GoogleMaps/GoogleMaps.h>
#import <React/RCTConvert.h>
#import <React/RCTConvert+CoreLocation.h>

@implementation AIRGoogleMapHeatmap

- (instancetype)init
{
  if (self = [super init]) {
    _heatmap = [[GMUHeatmapTileLayer alloc] init];
  }
  return self;
}

- (void)setPoints:(NSArray<NSDictionary *> *)points
{
    NSMutableArray<GMUWeightedLatLng *> *w = [NSMutableArray arrayWithCapacity:points.count];
    for (int i = 0; i < points.count; i++) {
        CLLocationCoordinate2D coord = [RCTConvert CLLocationCoordinate2D:points[i]];
        float intensity = 1.0;
        if (points[i][@"weight"] != nil) {
            intensity = [RCTConvert float:points[i][@"weight"]];
        }
        [w addObject:[[GMUWeightedLatLng alloc] initWithCoordinate:coord intensity:intensity]];
    }
    _points = w;
    [self.heatmap setWeightedData:w];
    [self.heatmap clearTileCache];
    [self.heatmap setMap:self.heatmap.map];
}

- (void)setRadius:(NSUInteger)radius
{
    _radius = radius;
    [self.heatmap setRadius:radius];
}

- (void)setOpacity:(float)opacity
{
    _opacity = opacity;
    [self.heatmap setOpacity:opacity];
}

- (void)setGradient:(NSDictionary *)gradient
{
    NSArray<UIColor *> *colors = [RCTConvert UIColorArray:gradient[@"colors"]];
    NSArray<NSNumber *> *colorStartPoints = [RCTConvert NSNumberArray:gradient[@"startPoints"]];
    NSUInteger colorMapSize = [RCTConvert NSUInteger:gradient[@"colorMapSize"]];
    
    GMUGradient *gmuGradient = [[GMUGradient alloc] initWithColors:colors
                                        startPoints:colorStartPoints
                                       colorMapSize:colorMapSize];
    _gradient = gmuGradient;
    [self.heatmap setGradient:gmuGradient];
}

@end