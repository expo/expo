//
//  AIRGMSPolygon.h
//  AirMaps
//
//  Created by Gerardo Pacheco 02/05/2017.
//

#import <GoogleMaps/GoogleMaps.h>
#import "UIView+React.h"

@class AIRGoogleMapPolygon;

@interface AIRGMSPolygon : GMSPolygon
@property (nonatomic, strong) NSString *identifier;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@end
