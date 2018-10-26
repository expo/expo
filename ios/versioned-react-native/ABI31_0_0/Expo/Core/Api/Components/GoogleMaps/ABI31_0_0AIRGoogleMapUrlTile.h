//
//  ABI31_0_0AIRGoogleMapURLTile.h
//  Created by Nick Italiano on 11/5/16.
//

#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>

@interface ABI31_0_0AIRGoogleMapUrlTile : UIView

@property (nonatomic, strong) GMSURLTileLayer *tileLayer;
@property (nonatomic, assign) NSString *urlTemplate;
@property (nonatomic, assign) int zIndex;
@property NSInteger *maximumZ;
@property NSInteger *minimumZ;

@end
