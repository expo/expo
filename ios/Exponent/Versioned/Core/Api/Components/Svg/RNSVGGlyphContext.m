/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


#import "RNSVGGlyphContext.h"
#import "RNSVGPercentageConverter.h"
#import <React/RCTFont.h>

@implementation RNSVGGlyphContext
{
    NSMutableArray<NSDictionary* > *_fontContext;
    NSMutableArray<NSValue* > *_locationContext;
    NSMutableArray<NSArray *> *_deltaXContext;
    NSMutableArray<NSArray *> *_deltaYContext;
    NSMutableArray<NSNumber *> *_xContext;
    CGPoint _currentLocation;
    CGFloat _width;
    CGFloat _height;
}

- (instancetype)initWithDimensions:(CGFloat)width height:(CGFloat)height
{
    if (self = [super init]) {
        _width = width;
        _height = height;
        _fontContext = [[NSMutableArray alloc] init];
        _locationContext = [[NSMutableArray alloc] init];
        _deltaXContext = [[NSMutableArray alloc] init];
        _deltaYContext = [[NSMutableArray alloc] init];
        _xContext = [[NSMutableArray alloc] init];
        _currentLocation = CGPointZero;
    }
    return self;
}

- (void)pushContext:(NSDictionary *)font deltaX:(NSArray<NSNumber *> *)deltaX deltaY:(NSArray<NSNumber *> *)deltaY positionX:(NSString *)positionX positionY:(NSString *)positionY
{
    CGPoint location = _currentLocation;
    
    if (positionX) {
        location.x = [RNSVGPercentageConverter stringToFloat:positionX relative:_width offset:0];
    }
    
    if (positionY) {
        location.y = [RNSVGPercentageConverter stringToFloat:positionY relative:_height offset:0];
    }
    
    [_locationContext addObject:[NSValue valueWithCGPoint:location]];
    [_fontContext addObject:font ? font : @{}];
    [_deltaXContext addObject:deltaX ? deltaX : @[]];
    [_deltaYContext addObject:deltaY ? deltaY : @[]];
    [_xContext addObject:[NSNumber numberWithFloat:location.x]];
    _currentLocation = location;
}

- (void)popContext
{
    NSNumber *x = [_xContext lastObject];
    [_fontContext removeLastObject];
    [_locationContext removeLastObject];
    [_deltaXContext removeLastObject];
    [_deltaYContext removeLastObject];
    [_xContext removeLastObject];
    
    if (_xContext.count) {
        [_xContext replaceObjectAtIndex:_xContext.count - 1 withObject:x];
    }
    
    if (_locationContext.count) {
        _currentLocation = [[_locationContext lastObject] CGPointValue];
        _currentLocation.x = [x floatValue];
        [_locationContext replaceObjectAtIndex:_locationContext.count - 1
                                    withObject:[NSValue valueWithCGPoint:_currentLocation]];
    }
}

- (CGPoint)getNextGlyphPoint:(CGPoint)offset glyphWidth:(CGFloat)glyphWidth
{
    CGPoint currentLocation = _currentLocation;
    NSNumber *dx = [self getNextDelta:_deltaXContext];
    currentLocation.x += [dx floatValue];
    
    NSNumber *dy = [self getNextDelta:_deltaYContext];
    currentLocation.y += [dy floatValue];
    
    for (NSUInteger i = 0; i < _locationContext.count; i++) {
        CGPoint point = [[_locationContext objectAtIndex:i] CGPointValue];
        point.x += [dx floatValue];
        point.y += [dy floatValue];
        [_locationContext replaceObjectAtIndex:i withObject:[NSValue valueWithCGPoint:point]];
    }
    
    _currentLocation = currentLocation;
    NSNumber *x = [NSNumber numberWithFloat:currentLocation.x + offset.x + glyphWidth];
    [_xContext replaceObjectAtIndex:_xContext.count - 1 withObject:x];
    return CGPointMake(currentLocation.x + offset.x, currentLocation.y + offset.y);
}

- (NSNumber *)getNextDelta:(NSMutableArray *)deltaContext
{
    NSNumber *value;
    NSUInteger index = deltaContext.count;
    for (NSArray *delta in [deltaContext reverseObjectEnumerator]) {
        index--;
        if (value == nil) {
            value = [delta firstObject];
        }
        
        if (delta.count) {
            NSMutableArray *mutableDelta = [delta mutableCopy];
            [mutableDelta removeObjectAtIndex:0];
            [deltaContext replaceObjectAtIndex:index withObject:[mutableDelta copy]];
        }
    }
    
    return value;
}

- (CTFontRef)getGlyphFont
{
    NSString *fontFamily;
    NSNumber *fontSize;
    NSString *fontWeight;
    NSString *fontStyle;

    for (NSDictionary *font in [_fontContext reverseObjectEnumerator]) {
        if (!fontFamily) {
            fontFamily = font[@"fontFamily"];
        }
        
        if (fontSize == nil) {
            fontSize = font[@"fontSize"];
        }
        
        if (!fontWeight) {
            fontWeight = font[@"fontWeight"];
        }
        if (!fontStyle) {
            fontStyle = font[@"fontStyle"];
        }
        
        if (fontFamily && fontSize && fontWeight && fontStyle) {
            break;
        }
    }
    
    BOOL fontFamilyFound = NO;
    NSArray *supportedFontFamilyNames = [UIFont familyNames];
    
    if ([supportedFontFamilyNames containsObject:fontFamily]) {
        fontFamilyFound = YES;
    } else {
        for (NSString *fontFamilyName in supportedFontFamilyNames) {
            if ([[UIFont fontNamesForFamilyName: fontFamilyName] containsObject:fontFamily]) {
                fontFamilyFound = YES;
                break;
            }
        }
    }
    fontFamily = fontFamilyFound ? fontFamily : nil;
    
    return (__bridge CTFontRef)[RCTFont updateFont:nil
                                        withFamily:fontFamily
                                              size:fontSize
                                            weight:fontWeight
                                             style:fontStyle
                                           variant:nil
                                   scaleMultiplier:1.0];
}

@end
