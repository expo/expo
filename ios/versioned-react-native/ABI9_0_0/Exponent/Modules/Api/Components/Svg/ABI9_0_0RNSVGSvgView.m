/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI9_0_0RNSVGSvgView.h"

#import "ABI9_0_0RNSVGNode.h"
#import "ABI9_0_0RCTLog.h"

@implementation ABI9_0_0RNSVGSvgView
{
    NSMutableDictionary<NSString *, ABI9_0_0RNSVGNode *> *clipPaths;
    NSMutableDictionary<NSString *, ABI9_0_0RNSVGNode *> *templates;
    NSMutableDictionary<NSString *, ABI9_0_0RNSVGBrushConverter *> *brushConverters;
    CGRect _boundingBox;
}

- (void)insertReactABI9_0_0Subview:(UIView *)subview atIndex:(NSInteger)atIndex
{
    [super insertReactABI9_0_0Subview:subview atIndex:atIndex];
    [self insertSubview:subview atIndex:atIndex];
    [self invalidate];
}

- (void)removeReactABI9_0_0Subview:(UIView *)subview
{
    [super removeReactABI9_0_0Subview:subview];
    [self invalidate];
}

- (void)didUpdateReactABI9_0_0Subviews
{
    // Do nothing, as subviews are inserted by insertReactABI9_0_0Subview:
}

- (void)invalidate
{
    [self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect
{
    clipPaths = nil;
    templates = nil;
    brushConverters = nil;
    _boundingBox = rect;
    CGContextRef context = UIGraphicsGetCurrentContext();
    
    for (ABI9_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI9_0_0RNSVGNode class]]) {
            if (node.responsible && !self.responsible) {
                self.responsible = YES;
                break;
            }
        }
    }
    
    for (ABI9_0_0RNSVGNode *node in self.subviews) {
        if ([node isKindOfClass:[ABI9_0_0RNSVGNode class]]) {
            [node saveDefinition];
            [node renderTo:context];
        }
    }
}

- (NSString *)getDataURL
{
    UIGraphicsBeginImageContextWithOptions(_boundingBox.size, NO, 0);
    [self drawRect:_boundingBox];
    UIImage * image = UIGraphicsGetImageFromCurrentImageContext();
    NSData *imageData = UIImagePNGRepresentation(image);
    NSString *base64 = [imageData base64EncodedStringWithOptions:NSDataBase64Encoding64CharacterLineLength];
    UIGraphicsEndImageContext();
    return base64;
}

- (void)ReactABI9_0_0SetInheritedBackgroundColor:(UIColor *)inheritedBackgroundColor
{
    self.backgroundColor = inheritedBackgroundColor;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    return self.responsible ? [super hitTest:point withEvent:event] : nil;
}

- (void)defineClipPath:(__kindof ABI9_0_0RNSVGNode *)clipPath clipPathRef:(NSString *)clipPathRef
{
    if (!clipPaths) {
        clipPaths = [[NSMutableDictionary alloc] init];
    }
    [clipPaths setObject:clipPath forKey:clipPathRef];
}

- (ABI9_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathRef
{
    return clipPaths ? [clipPaths objectForKey:clipPathRef] : nil;
}

- (void)defineTemplate:(ABI9_0_0RNSVGNode *)template templateRef:(NSString *)templateRef
{
    if (!templates) {
        templates = [[NSMutableDictionary alloc] init];
    }
    [templates setObject:template forKey:templateRef];
}

- (ABI9_0_0RNSVGNode *)getDefinedTemplate:(NSString *)tempalteRef
{
    return templates ? [templates objectForKey:tempalteRef] : nil;
}


- (void)defineBrushConverter:(ABI9_0_0RNSVGBrushConverter *)brushConverter brushConverterRef:(NSString *)brushConverterRef
{
    if (!brushConverters) {
        brushConverters = [[NSMutableDictionary alloc] init];
    }
    [brushConverters setObject:brushConverter forKey:brushConverterRef];
}

- (ABI9_0_0RNSVGBrushConverter *)getDefinedBrushConverter:(NSString *)brushConverterRef
{
    return brushConverters ? [brushConverters objectForKey:brushConverterRef] : nil;
}

@end
