//
//  ABI47_0_0AIRGoogleMapURLTile.h
//  Created by Nick Italiano on 11/5/16.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>

@interface ABI47_0_0AIRGoogleMapUrlTile : UIView

@property (nonatomic, strong) GMSURLTileLayer *tileLayer;
@property (nonatomic, assign) NSString *urlTemplate;
@property (nonatomic, assign) int zIndex;
@property NSInteger *maximumZ;
@property NSInteger *minimumZ;
@property BOOL flipY;

@end

#endif
