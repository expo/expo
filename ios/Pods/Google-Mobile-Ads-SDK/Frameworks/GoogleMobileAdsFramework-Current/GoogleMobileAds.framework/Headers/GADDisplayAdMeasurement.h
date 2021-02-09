//
//  GADDisplayAdMeasurement.h
//  Google Mobile Ads SDK
//
//  Copyright 2019 Google LLC. All rights reserved.
//
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

/// Measurement used for display custom native ad formats.
@interface GADDisplayAdMeasurement : NSObject

/// Ad view used to measure viewability. This property can be modified before or after starting
/// display ad measurement. Must be accessed on the main thread.
@property(nonatomic, weak, nullable) UIView *view;

/// Starts OMID viewability measurement for display ads. Returns whether OMID viewability was
/// started and sets |error| if unable to start. Once started, all subsequent calls return YES and
/// have no effect. Must be called on the main thread.
- (BOOL)startWithError:(NSError *_Nullable *_Nullable)error;

@end
