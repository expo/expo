//
//  AIRGoogleMapManager.h
//  AirMaps
//
//  Created by Gil Birman on 9/1/16.
//

#import <React/RCTViewManager.h>
#import "AIRGoogleMap.h"

@interface AIRGoogleMapManager : RCTViewManager
@property (nonatomic, assign) AIRGoogleMap *map;

@end
