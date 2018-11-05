//
//  GMSIndoorDisplay.h
//  Google Maps SDK for iOS
//
//  Copyright 2013 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <Foundation/Foundation.h>

@class GMSIndoorBuilding;
@class GMSIndoorLevel;

NS_ASSUME_NONNULL_BEGIN;

/** Delegate for events on GMSIndoorDisplay. */
@protocol GMSIndoorDisplayDelegate<NSObject>
@optional

/**
 * Raised when the activeBuilding has changed.  The activeLevel will also have already been updated
 * for the new building, but didChangeActiveLevel: will be raised after this method.
 */
- (void)didChangeActiveBuilding:(nullable GMSIndoorBuilding *)building;

/**
 * Raised when the activeLevel has changed.  This event is raised for all changes, including
 * explicit setting of the property.
 */
- (void)didChangeActiveLevel:(nullable GMSIndoorLevel *)level;

@end

/**
 * Provides ability to observe or control the display of indoor level data.
 *
 * Like GMSMapView, GMSIndoorDisplay may only be used from the main thread.
 */
@interface GMSIndoorDisplay : NSObject

/** GMSIndoorDisplay delegate */
@property(nonatomic, weak, nullable) id<GMSIndoorDisplayDelegate> delegate;

/**
 * Provides the currently focused building, will be nil if there is no building with indoor data
 * currently under focus.
 */
@property(nonatomic, strong, readonly, nullable) GMSIndoorBuilding *activeBuilding;

/**
 * Provides and controls the active level for activeBuilding.  Will be updated whenever
 * activeBuilding changes, and may be set to any member of activeBuilding's levels property.  May
 * also be set to nil if the building is underground, to stop showing the building (the building
 * will remain active).
 *
 * Will always be nil if activeBuilding is nil.
 *
 * Any attempt to set it to an invalid value will be ignored.
 */
@property(nonatomic, strong, nullable) GMSIndoorLevel *activeLevel;

@end

NS_ASSUME_NONNULL_END;
