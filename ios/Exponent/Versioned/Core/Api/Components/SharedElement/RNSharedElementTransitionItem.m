//
//  RNSharedElementTransitionItem.m
//  react-native-shared-element
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "RNSharedElementTransitionItem.h"

#ifdef DEBUG
#define DebugLog(...) NSLog(__VA_ARGS__)
#else
#define DebugLog(...) (void)0
#endif

@implementation RNSharedElementTransitionItem {
    
    CGRect _visibleLayoutCache;
}
- (instancetype)initWithNodeManager:(RNSharedElementNodeManager*)nodeManager name:(NSString*)name isAncestor:(BOOL)isAncestor
{
    _visibleLayoutCache = CGRectNull;
    _nodeManager = nodeManager;
    _name = name;
    _isAncestor = isAncestor;
    _node = nil;
    _needsLayout = NO;
    _needsContent = NO;
    _content = nil;
    _contentType = RNSharedElementContentTypeNone;
    _style = nil;
    _hidden = NO;
    return self;
}

- (void) setNode:(RNSharedElementNode *)node
{
    if (_node == node) {
        if (node != nil) [_nodeManager release:node];
        return;
    }
    if (_node != nil) {
        if (_hidden) _node.hideRefCount--;
        [_nodeManager release:_node];
    }
    _node = node;
    _needsLayout = node != nil;
    _needsContent = !_isAncestor && (node != nil);
    _content = nil;
    _contentType = RNSharedElementContentTypeNone;
    _style = nil;
    _hidden = NO;
}

- (void) setHidden:(BOOL)hidden
{
    if (_hidden == hidden) return;
    _hidden = hidden;
    if (hidden) {
        _node.hideRefCount++;
    } else {
        _node.hideRefCount--;
    }
}

- (NSString*) contentTypeName
{
    switch(_contentType) {
        case RNSharedElementContentTypeNone: return @"none";
        case RNSharedElementContentTypeRawImage: return @"image";
        case RNSharedElementContentTypeSnapshotView: return @"snapshotView";
        case RNSharedElementContentTypeSnapshotImage: return @"snapshotImage";
        default: return @"unknown";
    }
}

+ (CGSize) contentSizeFor:(CGRect)layout content:(id)content contentType:(RNSharedElementContentType)contentType
{
    if (!content) return layout.size;
    if (contentType != RNSharedElementContentTypeRawImage) return layout.size;
    CGSize size = layout.size;
    return [content isKindOfClass:[UIImage class]] ? ((UIImage*)content).size : size;
}

+ (CGRect) contentLayoutFor:(CGRect)layout content:(id)content contentType:(RNSharedElementContentType)contentType contentMode:(UIViewContentMode) contentMode reverse:(BOOL)reverse
{
    if (!content) return layout;
    if (contentType != RNSharedElementContentTypeRawImage) return layout;
    CGSize size = layout.size;
    CGSize contentSize = [RNSharedElementTransitionItem contentSizeFor:layout content:content contentType:contentType];
    CGFloat contentAspectRatio = (contentSize.width / contentSize.height);
    BOOL lo = (size.width / size.height) < contentAspectRatio;
    BOOL aspectRatioCriteria = reverse ? !lo : lo;
    switch (contentMode) {
        case UIViewContentModeScaleToFill: // stretch
            break;
        case UIViewContentModeScaleAspectFit: // contain
            if (aspectRatioCriteria) {
                size.height = size.width / contentAspectRatio;
            } else {
                size.width = size.height * contentAspectRatio;
            }
            break;
        case UIViewContentModeScaleAspectFill: // cover
            if (aspectRatioCriteria) {
                size.width = size.height * contentAspectRatio;
            } else {
                size.height = size.width / contentAspectRatio;
            }
            break;
        case UIViewContentModeCenter: // center
            size = contentSize;
            break;
        default:
            break;
    }
    CGRect contentLayout = layout;
    contentLayout.origin.x += (contentLayout.size.width - size.width) / 2;
    contentLayout.origin.y += (contentLayout.size.height - size.height) / 2;
    contentLayout.size = size;
    return contentLayout;
}

- (CGRect) contentLayoutForContent:(id)content contentType:(RNSharedElementContentType)contentType
{
    if (!content || !_style) return CGRectZero;
    return [RNSharedElementTransitionItem contentLayoutFor:_style.layout content:content contentType:contentType contentMode:_style.contentMode reverse:NO];
}

- (CGRect) visibleLayoutForAncestor:(RNSharedElementTransitionItem*) ancestor
{
    if (!CGRectIsNull(_visibleLayoutCache) || !_style) return _visibleLayoutCache;
    if (!ancestor.style) return _style.layout;
    
    // Get visible area (some parts may be clipped in a scrollview or something)
    CGRect visibleLayout = _style.layout;
    UIView* superview = _style.view.superview;
    while (superview != nil) {
        if (superview.layer.masksToBounds || (superview.layer.mask != nil)) {
            CGRect superLayout = [superview convertRect:superview.bounds toView:nil];
            CGRect intersectedLayout = CGRectIntersection(visibleLayout, superLayout);
            if (isinf(intersectedLayout.origin.x) || isinf(intersectedLayout.origin.y) || CGRectIsEmpty(intersectedLayout)) {
                if ((visibleLayout.origin.y + visibleLayout.size.height) < superLayout.origin.y) {
                    visibleLayout.origin.y = superLayout.origin.y;
                    visibleLayout.size.height = 0;
                }
                if (visibleLayout.origin.y > (superLayout.origin.y + superLayout.size.height)) {
                    visibleLayout.origin.y = superLayout.origin.y + superLayout.size.height;
                    visibleLayout.size.height = 0;
                }
                if ((visibleLayout.origin.x + visibleLayout.size.width) < superLayout.origin.x) {
                    visibleLayout.origin.x = superLayout.origin.x;
                    visibleLayout.size.width = 0;
                }
                if (visibleLayout.origin.x > (superLayout.origin.x + superLayout.size.width)) {
                    visibleLayout.origin.x = superLayout.origin.x + superLayout.size.width;
                    visibleLayout.size.width = 0;
                }
                break;
            }
            visibleLayout = intersectedLayout;
        }
        if (superview == ancestor.style.view) break;
        superview = superview.superview;
    }
    _visibleLayoutCache = visibleLayout;
    return visibleLayout;
}


@end
