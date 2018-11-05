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

#import "GoogleMapsDemos/Samples/PolygonsViewController.h"

#import <GoogleMaps/GoogleMaps.h>

@implementation PolygonsViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  GMSCameraPosition *camera = [GMSCameraPosition cameraWithLatitude:39.13006
                                                          longitude:-77.508545
                                                               zoom:4];
  GMSMapView *mapView = [GMSMapView mapWithFrame:CGRectZero camera:camera];
  mapView.delegate = self; // needed for didTapOverlay delegate method

  // Create the first polygon.
  GMSPolygon *polygon = [[GMSPolygon alloc] init];
  polygon.path = [self pathOfNewYorkState];
  polygon.holes = @[ [self pathOfNewYorkStateHole] ];
  polygon.title = @"New York";
  polygon.fillColor = [UIColor colorWithRed:0.25 green:0 blue:0 alpha:0.2f];
  polygon.strokeColor = [UIColor blackColor];
  polygon.strokeWidth = 2;
  polygon.tappable = YES;
  polygon.map = mapView;

  // Copy the existing polygon and its settings and use it as a base for the
  // second polygon.
  polygon = [polygon copy];
  polygon.title = @"North Carolina";
  polygon.path = [self pathOfNorthCarolina];
  polygon.fillColor = [UIColor colorWithRed:0 green:0.25 blue:0 alpha:0.5];
  polygon.map = mapView;

  self.view = mapView;
}

- (void)mapView:(GMSMapView *)mapView didTapOverlay:(GMSOverlay *)overlay {
  // When a polygon is tapped, randomly change its fill color to a new hue.
  if ([overlay isKindOfClass:[GMSPolygon class]]) {
    GMSPolygon *polygon = (GMSPolygon *)overlay;
    CGFloat hue = (((float)arc4random()/0x100000000)*1.0f);
    polygon.fillColor =
      [UIColor colorWithHue:hue saturation:1 brightness:1 alpha:0.5];
  }
}

- (GMSPath *)pathOfNewYorkState {
  GMSMutablePath *path = [GMSMutablePath path];
  [path addLatitude:42.5142 longitude:-79.7624];
  [path addLatitude:42.7783 longitude:-79.0672];
  [path addLatitude:42.8508 longitude:-78.9313];
  [path addLatitude:42.9061 longitude:-78.9024];
  [path addLatitude:42.9554 longitude:-78.9313];
  [path addLatitude:42.9584 longitude:-78.9656];
  [path addLatitude:42.9886 longitude:-79.0219];
  [path addLatitude:43.0568 longitude:-79.0027];
  [path addLatitude:43.0769 longitude:-79.0727];
  [path addLatitude:43.1220 longitude:-79.0713];
  [path addLatitude:43.1441 longitude:-79.0302];
  [path addLatitude:43.1801 longitude:-79.0576];
  [path addLatitude:43.2482 longitude:-79.0604];
  [path addLatitude:43.2812 longitude:-79.0837];
  [path addLatitude:43.4509 longitude:-79.2004];
  [path addLatitude:43.6311 longitude:-78.6909];
  [path addLatitude:43.6321 longitude:-76.7958];
  [path addLatitude:43.9987 longitude:-76.4978];
  [path addLatitude:44.0965 longitude:-76.4388];
  [path addLatitude:44.1349 longitude:-76.3536];
  [path addLatitude:44.1989 longitude:-76.3124];
  [path addLatitude:44.2049 longitude:-76.2437];
  [path addLatitude:44.2413 longitude:-76.1655];
  [path addLatitude:44.2973 longitude:-76.1353];
  [path addLatitude:44.3327 longitude:-76.0474];
  [path addLatitude:44.3553 longitude:-75.9856];
  [path addLatitude:44.3749 longitude:-75.9196];
  [path addLatitude:44.3994 longitude:-75.8730];
  [path addLatitude:44.4308 longitude:-75.8221];
  [path addLatitude:44.4740 longitude:-75.8098];
  [path addLatitude:44.5425 longitude:-75.7288];
  [path addLatitude:44.6647 longitude:-75.5585];
  [path addLatitude:44.7672 longitude:-75.4088];
  [path addLatitude:44.8101 longitude:-75.3442];
  [path addLatitude:44.8383 longitude:-75.3058];
  [path addLatitude:44.8676 longitude:-75.2399];
  [path addLatitude:44.9211 longitude:-75.1204];
  [path addLatitude:44.9609 longitude:-74.9995];
  [path addLatitude:44.9803 longitude:-74.9899];
  [path addLatitude:44.9852 longitude:-74.9103];
  [path addLatitude:45.0017 longitude:-74.8856];
  [path addLatitude:45.0153 longitude:-74.8306];
  [path addLatitude:45.0046 longitude:-74.7633];
  [path addLatitude:45.0027 longitude:-74.7070];
  [path addLatitude:45.0007 longitude:-74.5642];
  [path addLatitude:44.9920 longitude:-74.1467];
  [path addLatitude:45.0037 longitude:-73.7306];
  [path addLatitude:45.0085 longitude:-73.4203];
  [path addLatitude:45.0109 longitude:-73.3430];
  [path addLatitude:44.9874 longitude:-73.3547];
  [path addLatitude:44.9648 longitude:-73.3379];
  [path addLatitude:44.9160 longitude:-73.3396];
  [path addLatitude:44.8354 longitude:-73.3739];
  [path addLatitude:44.8013 longitude:-73.3324];
  [path addLatitude:44.7419 longitude:-73.3667];
  [path addLatitude:44.6139 longitude:-73.3873];
  [path addLatitude:44.5787 longitude:-73.3736];
  [path addLatitude:44.4916 longitude:-73.3049];
  [path addLatitude:44.4289 longitude:-73.2953];
  [path addLatitude:44.3513 longitude:-73.3365];
  [path addLatitude:44.2757 longitude:-73.3118];
  [path addLatitude:44.1980 longitude:-73.3818];
  [path addLatitude:44.1142 longitude:-73.4079];
  [path addLatitude:44.0511 longitude:-73.4367];
  [path addLatitude:44.0165 longitude:-73.4065];
  [path addLatitude:43.9375 longitude:-73.4079];
  [path addLatitude:43.8771 longitude:-73.3749];
  [path addLatitude:43.8167 longitude:-73.3914];
  [path addLatitude:43.7790 longitude:-73.3557];
  [path addLatitude:43.6460 longitude:-73.4244];
  [path addLatitude:43.5893 longitude:-73.4340];
  [path addLatitude:43.5655 longitude:-73.3969];
  [path addLatitude:43.6112 longitude:-73.3818];
  [path addLatitude:43.6271 longitude:-73.3049];
  [path addLatitude:43.5764 longitude:-73.3063];
  [path addLatitude:43.5675 longitude:-73.2582];
  [path addLatitude:43.5227 longitude:-73.2445];
  [path addLatitude:43.2582 longitude:-73.2582];
  [path addLatitude:42.9715 longitude:-73.2733];
  [path addLatitude:42.8004 longitude:-73.2898];
  [path addLatitude:42.7460 longitude:-73.2664];
  [path addLatitude:42.4630 longitude:-73.3708];
  [path addLatitude:42.0840 longitude:-73.5095];
  [path addLatitude:42.0218 longitude:-73.4903];
  [path addLatitude:41.8808 longitude:-73.4999];
  [path addLatitude:41.2953 longitude:-73.5535];
  [path addLatitude:41.2128 longitude:-73.4834];
  [path addLatitude:41.1011 longitude:-73.7275];
  [path addLatitude:41.0237 longitude:-73.6644];
  [path addLatitude:40.9851 longitude:-73.6578];
  [path addLatitude:40.9509 longitude:-73.6132];
  [path addLatitude:41.1869 longitude:-72.4823];
  [path addLatitude:41.2551 longitude:-72.0950];
  [path addLatitude:41.3005 longitude:-71.9714];
  [path addLatitude:41.3108 longitude:-71.9193];
  [path addLatitude:41.1838 longitude:-71.7915];
  [path addLatitude:41.1249 longitude:-71.7929];
  [path addLatitude:41.0462 longitude:-71.7517];
  [path addLatitude:40.6306 longitude:-72.9465];
  [path addLatitude:40.5368 longitude:-73.4628];
  [path addLatitude:40.4887 longitude:-73.8885];
  [path addLatitude:40.5232 longitude:-73.9490];
  [path addLatitude:40.4772 longitude:-74.2271];
  [path addLatitude:40.4861 longitude:-74.2532];
  [path addLatitude:40.6468 longitude:-74.1866];
  [path addLatitude:40.6556 longitude:-74.0547];
  [path addLatitude:40.7618 longitude:-74.0156];
  [path addLatitude:40.8699 longitude:-73.9421];
  [path addLatitude:40.9980 longitude:-73.8934];
  [path addLatitude:41.0343 longitude:-73.9854];
  [path addLatitude:41.3268 longitude:-74.6274];
  [path addLatitude:41.3583 longitude:-74.7084];
  [path addLatitude:41.3811 longitude:-74.7101];
  [path addLatitude:41.4386 longitude:-74.8265];
  [path addLatitude:41.5075 longitude:-74.9913];
  [path addLatitude:41.6000 longitude:-75.0668];
  [path addLatitude:41.6719 longitude:-75.0366];
  [path addLatitude:41.7672 longitude:-75.0545];
  [path addLatitude:41.8808 longitude:-75.1945];
  [path addLatitude:42.0013 longitude:-75.3552];
  [path addLatitude:42.0003 longitude:-75.4266];
  [path addLatitude:42.0013 longitude:-77.0306];
  [path addLatitude:41.9993 longitude:-79.7250];
  [path addLatitude:42.0003 longitude:-79.7621];
  [path addLatitude:42.1827 longitude:-79.7621];
  [path addLatitude:42.5146 longitude:-79.7621];
  return path;
}

- (GMSPath *)pathOfNewYorkStateHole {
  GMSMutablePath *path = [GMSMutablePath path];
  [path addLatitude:43.5000 longitude:-76.3651];
  [path addLatitude:43.5000 longitude:-74.3651];
  [path addLatitude:42.0000 longitude:-74.3651];
  return path;
}

- (GMSPath *)pathOfNorthCarolina {
  GMSMutablePath *path = [GMSMutablePath path];
  [path addLatitude:33.7963 longitude:-78.4850];
  [path addLatitude:34.8037 longitude:-79.6742];
  [path addLatitude:34.8206 longitude:-80.8003];
  [path addLatitude:34.9377 longitude:-80.7880];
  [path addLatitude:35.1019 longitude:-80.9377];
  [path addLatitude:35.0356 longitude:-81.0379];
  [path addLatitude:35.1457 longitude:-81.0324];
  [path addLatitude:35.1660 longitude:-81.3867];
  [path addLatitude:35.1985 longitude:-82.2739];
  [path addLatitude:35.2041 longitude:-82.3933];
  [path addLatitude:35.0637 longitude:-82.7765];
  [path addLatitude:35.0817 longitude:-82.7861];
  [path addLatitude:34.9996 longitude:-83.1075];
  [path addLatitude:34.9918 longitude:-83.6183];
  [path addLatitude:34.9918 longitude:-84.3201];
  [path addLatitude:35.2131 longitude:-84.2885];
  [path addLatitude:35.2680 longitude:-84.2226];
  [path addLatitude:35.2310 longitude:-84.1113];
  [path addLatitude:35.2815 longitude:-84.0454];
  [path addLatitude:35.4058 longitude:-84.0248];
  [path addLatitude:35.4719 longitude:-83.9424];
  [path addLatitude:35.5166 longitude:-83.8559];
  [path addLatitude:35.5512 longitude:-83.6938];
  [path addLatitude:35.5680 longitude:-83.5181];
  [path addLatitude:35.6327 longitude:-83.3849];
  [path addLatitude:35.7142 longitude:-83.2475];
  [path addLatitude:35.7799 longitude:-82.9962];
  [path addLatitude:35.8445 longitude:-82.9276];
  [path addLatitude:35.9224 longitude:-82.8191];
  [path addLatitude:35.9958 longitude:-82.7710];
  [path addLatitude:36.0613 longitude:-82.6419];
  [path addLatitude:35.9702 longitude:-82.6103];
  [path addLatitude:35.9547 longitude:-82.5677];
  [path addLatitude:36.0236 longitude:-82.4730];
  [path addLatitude:36.0669 longitude:-82.4194];
  [path addLatitude:36.1168 longitude:-82.3535];
  [path addLatitude:36.1345 longitude:-82.2862];
  [path addLatitude:36.1467 longitude:-82.1461];
  [path addLatitude:36.1035 longitude:-82.1228];
  [path addLatitude:36.1268 longitude:-82.0267];
  [path addLatitude:36.2797 longitude:-81.9360];
  [path addLatitude:36.3527 longitude:-81.7987];
  [path addLatitude:36.3361 longitude:-81.7081];
  [path addLatitude:36.5880 longitude:-81.6724];
  [path addLatitude:36.5659 longitude:-80.7234];
  [path addLatitude:36.5438 longitude:-80.2977];
  [path addLatitude:36.5449 longitude:-79.6729];
  [path addLatitude:36.5449 longitude:-77.2559];
  [path addLatitude:36.5505 longitude:-75.7562];
  [path addLatitude:36.3129 longitude:-75.7068];
  [path addLatitude:35.7131 longitude:-75.4129];
  [path addLatitude:35.2041 longitude:-75.4720];
  [path addLatitude:34.9794 longitude:-76.0748];
  [path addLatitude:34.5258 longitude:-76.4951];
  [path addLatitude:34.5880 longitude:-76.8109];
  [path addLatitude:34.5314 longitude:-77.1378];
  [path addLatitude:34.3910 longitude:-77.4481];
  [path addLatitude:34.0481 longitude:-77.7983];
  [path addLatitude:33.7666 longitude:-77.9260];
  [path addLatitude:33.7963 longitude:-78.4863];
  return path;
}

@end
