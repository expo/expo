//
//  GMSPanoramaSource.h
//  Google Maps SDK for iOS
//
//  Copyright 2017 Google Inc.
//
//  Usage of this SDK is subject to the Google Maps/Google Earth APIs Terms of
//  Service: https://developers.google.com/maps/terms
//

#import <Foundation/Foundation.h>

/**
 * \defgroup PanoramaSource GMSPanoramaSource
 * @{
 */

/**
 * Source types for Panoramas. Used to specify the source of a StreetView Panorama.
 *
 * This API is experimental. Results may not always match expectations.
 */
typedef NS_ENUM(NSUInteger, GMSPanoramaSource) {
  /** Panoramas of locations either inside or outside. */
  kGMSPanoramaSourceDefault = 0,
  /** Panoramas of locations outside. */
  kGMSPanoramaSourceOutside,
};

/**@}*/
