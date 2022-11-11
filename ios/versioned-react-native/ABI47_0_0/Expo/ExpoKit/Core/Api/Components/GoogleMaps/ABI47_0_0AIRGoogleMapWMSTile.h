//
//  ABI47_0_0AIRGoogleMapWMSTile.h
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef ABI47_0_0HAVE_GOOGLE_MAPS

#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>

@interface ABI47_0_0WMSTileOverlay : GMSSyncTileLayer
@property (nonatomic) double MapX,MapY,FULL;
@property (nonatomic, strong) NSString *template;
@property (nonatomic, assign) NSInteger maximumZ;
@property (nonatomic, assign) NSInteger minimumZ;
@end

@interface ABI47_0_0AIRGoogleMapWMSTile : UIView
@property (nonatomic, strong) ABI47_0_0WMSTileOverlay *tileLayer;
@property (nonatomic, assign) NSString *urlTemplate;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) NSInteger maximumZ;
@property (nonatomic, assign) NSInteger minimumZ;
@property (nonatomic, assign) NSInteger tileSize;
@property (nonatomic, assign) float opacity;
@end

#endif


