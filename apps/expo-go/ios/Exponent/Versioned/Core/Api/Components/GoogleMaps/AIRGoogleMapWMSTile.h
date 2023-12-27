//
//  AIRGoogleMapWMSTile.h
//  AirMaps
//
//  Created by nizam on 10/28/18.
//  Copyright © 2018. All rights reserved.
//

#ifdef HAVE_GOOGLE_MAPS

#import <Foundation/Foundation.h>
#import <GoogleMaps/GoogleMaps.h>

@interface WMSTileOverlay : GMSSyncTileLayer
@property (nonatomic) double MapX,MapY,FULL;
@property (nonatomic, strong) NSString *template;
@property (nonatomic, assign) NSInteger maximumZ;
@property (nonatomic, assign) NSInteger minimumZ;
@end

@interface AIRGoogleMapWMSTile : UIView
@property (nonatomic, strong) WMSTileOverlay *tileLayer;
@property (nonatomic, assign) NSString *urlTemplate;
@property (nonatomic, assign) int zIndex;
@property (nonatomic, assign) NSInteger maximumZ;
@property (nonatomic, assign) NSInteger minimumZ;
@property (nonatomic, assign) NSInteger tileSize;
@property (nonatomic, assign) float opacity;
@end

#endif


