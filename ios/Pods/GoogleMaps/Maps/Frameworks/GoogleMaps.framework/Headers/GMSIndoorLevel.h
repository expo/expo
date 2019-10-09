//
//  GMSIndoorLevel.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//


#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Describes a single level in a building.
 *
 * Multiple buildings can share a level - in this case the level instances will compare as equal,
 * even though the level numbers/names may be different.
 */
@interface GMSIndoorLevel : NSObject

/** Localized display name for the level, e.g. "Ground floor". */
@property(nonatomic, copy, readonly, nullable) NSString *name;

/** Localized short display name for the level, e.g. "1". */
@property(nonatomic, copy, readonly, nullable) NSString *shortName;

@end

NS_ASSUME_NONNULL_END
