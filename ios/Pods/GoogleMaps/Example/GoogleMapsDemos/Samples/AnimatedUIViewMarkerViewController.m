/*
 * Copyright 2016 Google Inc. All rights reserved.
 *
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this
 * file except in compliance with the License. You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
 * ANY KIND, either express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

#if !defined(__has_feature) || !__has_feature(objc_arc)
#error "This file requires ARC support."
#endif

#import "GoogleMapsDemos/Samples/AnimatedUIViewMarkerViewController.h"

#import <GoogleMaps/GoogleMaps.h>

// Returns a random value from 0-1.0f.
static CGFloat randf() { return (((float)arc4random() / 0x100000000) * 1.0f); }

@interface AnimatedUIViewMarkerViewController ()<GMSMapViewDelegate>
@end

@implementation AnimatedUIViewMarkerViewController {
  GMSMapView *_mapView;
  UIView *_infoView;
}

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera =
      [GMSCameraPosition cameraWithLatitude:-33.8683 longitude:151.2086 zoom:5];
  _mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  _mapView.delegate = self;

  self.view = _mapView;
}

- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(applicationWillEnterForeground)
                                               name:UIApplicationWillEnterForegroundNotification
                                             object:nil];
  [_mapView clear];
  [self addDefaultMarker];
}

- (void)applicationWillEnterForeground {
  [_mapView clear];
  [self addDefaultMarker];
}

- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)mapView:(GMSMapView *)mapView markerInfoContents:(GMSMarker *)marker {
  // Show an info window with dynamic content - a simple background color animation.
  _infoView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"arrow"]];
  UIView *infoView = _infoView;
  marker.tracksInfoWindowChanges = YES;
  UIColor *color = [UIColor colorWithHue:randf() saturation:1.f brightness:1.f alpha:1.0f];
  _infoView.backgroundColor = [UIColor clearColor];
  [UIView animateWithDuration:1.0
      delay:1.0
      options:UIViewAnimationOptionCurveLinear
      animations:^{
        infoView.backgroundColor = color;
      }
      completion:^(BOOL finished) {
        [UIView animateWithDuration:1.0
            delay:0.0
            options:UIViewAnimationOptionCurveLinear
            animations:^{
              infoView.backgroundColor = [UIColor clearColor];
            }
            completion:^(BOOL finished2) {
              marker.tracksInfoWindowChanges = NO;
            }];
      }];

  return _infoView;
}

- (void)mapView:(GMSMapView *)mapView didCloseInfoWindowOfMarker:(GMSMarker *)marker {
  _infoView = nil;
  marker.tracksInfoWindowChanges = NO;
}

- (void)addDefaultMarker {
  // Add a custom 'glow' marker with a pulsing blue shadow on Sydney.
  GMSMarker *sydneyMarker = [[GMSMarker alloc] init];
  sydneyMarker.title = @"Sydney!";
  sydneyMarker.iconView = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"glow-marker"]];
  sydneyMarker.position = CLLocationCoordinate2DMake(-33.8683, 151.2086);
  sydneyMarker.iconView.contentMode = UIViewContentModeCenter;
  CGRect oldBound = sydneyMarker.iconView.bounds;
  CGRect bound = oldBound;
  bound.size.width *= 2;
  bound.size.height *= 2;
  sydneyMarker.iconView.bounds = bound;
  sydneyMarker.groundAnchor = CGPointMake(0.5, 0.75);
  sydneyMarker.infoWindowAnchor = CGPointMake(0.5, 0.25);
  UIView *sydneyGlow = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"glow-marker"]];
  sydneyGlow.layer.shadowColor = [UIColor blueColor].CGColor;
  sydneyGlow.layer.shadowOffset = CGSizeZero;
  sydneyGlow.layer.shadowRadius = 8.0;
  sydneyGlow.layer.shadowOpacity = 1.0;
  sydneyGlow.layer.opacity = 0.0;
  [sydneyMarker.iconView addSubview:sydneyGlow];
  sydneyGlow.center = CGPointMake(oldBound.size.width, oldBound.size.height);
  sydneyMarker.map = _mapView;
  [UIView animateWithDuration:1.0
      delay:0.0
      options:UIViewAnimationOptionCurveEaseInOut | UIViewKeyframeAnimationOptionAutoreverse |
              UIViewKeyframeAnimationOptionRepeat
      animations:^{
        sydneyGlow.layer.opacity = 1.0;
      }
      completion:^(BOOL finished) {
        // If the animation is ever terminated, no need to keep tracking the view for changes.
        sydneyMarker.tracksViewChanges = NO;
      }];
}

@end
