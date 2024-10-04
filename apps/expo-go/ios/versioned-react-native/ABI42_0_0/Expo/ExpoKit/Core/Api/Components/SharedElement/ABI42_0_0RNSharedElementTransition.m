//
//  ABI42_0_0RNSharedElementTransition.m
//  ABI42_0_0React-native-shared-element
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreImage/CoreImage.h>
#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>
#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import "ABI42_0_0RNSharedElementTransition.h"
#import "ABI42_0_0RNSharedElementTransitionItem.h"

#define ITEM_START_ANCESTOR 0
#define ITEM_END_ANCESTOR 1
#define ITEM_START 2
#define ITEM_END 3

#ifdef DEBUG
#define DebugLog(...) NSLog(__VA_ARGS__)
#else
#define DebugLog(...) (void)0
#endif

@implementation ABI42_0_0RNSharedElementTransition
{
  NSArray* _items;
  UIView* _outerStyleView;
  UIView* _innerClipView;
  UIImageView* _primaryImageView;
  UIImageView* _secondaryImageView;
  BOOL _ABI42_0_0ReactFrameSet;
  BOOL _initialLayoutPassCompleted;
  int _initialVisibleAncestorIndex;
}

- (instancetype)initWithNodeManager:(ABI42_0_0RNSharedElementNodeManager*)nodeManager
{
  if ((self = [super init])) {
    _items = @[
      [[ABI42_0_0RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"startAncestor" isAncestor:YES],
      [[ABI42_0_0RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"endAncestor" isAncestor:YES],
      [[ABI42_0_0RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"startNode" isAncestor:NO],
      [[ABI42_0_0RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"endNode" isAncestor:NO]
    ];
    _nodePosition = 0.0f;
    _animation = ABI42_0_0RNSharedElementAnimationMove;
    _resize = ABI42_0_0RNSharedElementResizeStretch;
    _align = ABI42_0_0RNSharedElementAlignCenterCenter;
    _ABI42_0_0ReactFrameSet = NO;
    _initialLayoutPassCompleted = NO;
    _initialVisibleAncestorIndex = -1;
    self.userInteractionEnabled = NO;
    
    _outerStyleView = [[UIImageView alloc]init];
    _outerStyleView.userInteractionEnabled = NO;
    _outerStyleView.frame = self.bounds;
    [self addSubview:_outerStyleView];
    
    _innerClipView = [[UIImageView alloc]init];
    _innerClipView.userInteractionEnabled = NO;
    _innerClipView.frame = self.bounds;
    _innerClipView.layer.masksToBounds = YES;
    [_outerStyleView addSubview:_innerClipView];
    
    _primaryImageView = [self createImageView];
    _secondaryImageView = [self createImageView];
  }
  
  return self;
}

- (void)removeFromSuperview
{
  [super removeFromSuperview];
  
  for (ABI42_0_0RNSharedElementTransitionItem* item in _items) {
    if (item.node != nil) [item.node cancelRequests:self];
  }
}

- (void)dealloc
{
  for (ABI42_0_0RNSharedElementTransitionItem* item in _items) {
    item.node = nil;
  }
}

- (UIImageView*) createImageView
{
  UIImageView* imageView = [[UIImageView alloc]init];
  imageView.contentMode = UIViewContentModeScaleToFill;
  imageView.userInteractionEnabled = NO;
  imageView.frame = self.bounds;
  return imageView;
}

- (ABI42_0_0RNSharedElementTransitionItem*) findItemForNode:(ABI42_0_0RNSharedElementNode*) node
{
  for (ABI42_0_0RNSharedElementTransitionItem* item in _items) {
    if (item.node == node) {
      return item;
    }
  }
  return nil;
}

- (void)setStartNode:(ABI42_0_0RNSharedElementNode *)startNode
{
  ((ABI42_0_0RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_START]).node = startNode;
}

- (void)setEndNode:(ABI42_0_0RNSharedElementNode *)endNode
{
  ((ABI42_0_0RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_END]).node = endNode;
}

- (void)setStartAncestor:(ABI42_0_0RNSharedElementNode *)startNodeAncestor
{
  ((ABI42_0_0RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_START_ANCESTOR]).node = startNodeAncestor;
}

- (void)setEndAncestor:(ABI42_0_0RNSharedElementNode *)endNodeAncestor
{
  ((ABI42_0_0RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_END_ANCESTOR]).node = endNodeAncestor;
}

- (void)setNodePosition:(CGFloat)nodePosition
{
  if (_nodePosition != nodePosition) {
    _nodePosition = nodePosition;
    [self updateStyle];
  }
}

- (void) setAnimation:(ABI42_0_0RNSharedElementAnimation)animation
{
  if (_animation != animation) {
    _animation = animation;
    [self updateStyle];
  }
}

- (void) setResize:(ABI42_0_0RNSharedElementResize)resize
{
  if (_resize != resize) {
    _resize = resize;
    [self updateStyle];
  }
}

- (void) setAlign:(ABI42_0_0RNSharedElementAlign)align
{
  if (_align != align) {
    _align = align;
    [self updateStyle];
  }
}

- (void)updateNodeVisibility
{
  for (ABI42_0_0RNSharedElementTransitionItem* item in _items) {
    BOOL hidden = _initialLayoutPassCompleted && item.style != nil && item.content != nil;
    if (hidden && (_animation == ABI42_0_0RNSharedElementAnimationFadeIn) && [item.name isEqualToString:@"startNode"]) hidden = NO;
    if (hidden && (_animation == ABI42_0_0RNSharedElementAnimationFadeOut) && [item.name isEqualToString:@"endNode"]) hidden = NO;
    item.hidden = hidden;
  }
}

- (void) didSetProps:(NSArray<NSString *> *)changedProps
{
  for (ABI42_0_0RNSharedElementTransitionItem* item in _items) {
    if (_initialLayoutPassCompleted && item.needsLayout) {
      item.needsLayout = NO;
      [item.node requestStyle:self];
    }
  }
  [self updateNodeVisibility];
}

- (void)updateViewWithImage:(UIImageView*)view image:(UIImage *)image
{
  if (!image) {
    view.image = nil;
    return;
  }
  
  // Apply trilinear filtering to smooth out mis-sized images
  view.layer.minificationFilter = kCAFilterTrilinear;
  view.layer.magnificationFilter = kCAFilterTrilinear;
  
  // NSLog(@"updateWithImage: %@", NSStringFromCGRect(self.frame));
  view.image = image;
}

- (void) didLoadContent:(ABI42_0_0RNSharedElementContent*)content node:(id)node
{
  // NSLog(@"didLoadContent: %@", content);
  ABI42_0_0RNSharedElementTransitionItem* item = [self findItemForNode:node];
  if (item == nil) return;
  item.content = content;
  if ((content.type == ABI42_0_0RNSharedElementContentTypeSnapshotImage) || (content.type == ABI42_0_0RNSharedElementContentTypeRawImage)) {
    UIImage* image = (UIImage*) content.data;
    if (_animation == ABI42_0_0RNSharedElementAnimationMove) {
      if (_primaryImageView.image == nil) {
        [self updateViewWithImage:_primaryImageView image:image];
      } else if ((image.size.width * image.size.height) > (_primaryImageView.image.size.width * _primaryImageView.image.size.height)) {
        [self updateViewWithImage:_primaryImageView image:image];
      }
    } else {
      if (item == _items[ITEM_START]) {
        [self updateViewWithImage:_primaryImageView image:image];
      } else {
        [self updateViewWithImage:_secondaryImageView image:image];
      }
    }
  }
  [self updateStyle];
  [self updateNodeVisibility];
}

- (void) didLoadStyle:(ABI42_0_0RNSharedElementStyle *)style node:(ABI42_0_0RNSharedElementNode*)node
{
  // NSLog(@"didLoadStyle: %@", NSStringFromCGRect(style.layout));
  ABI42_0_0RNSharedElementTransitionItem* item = [self findItemForNode:node];
  if (item == nil) return;
  item.style = style;
  [self updateStyle];
  [self updateNodeVisibility];
}

- (CGRect)normalizeLayout:(CGRect)layout
  compensateForTransforms:(BOOL)compensateForTransforms
                 ancestor:(ABI42_0_0RNSharedElementTransitionItem*)ancestor
            otherAncestor:(ABI42_0_0RNSharedElementTransitionItem*)otherAncestor

{
  // Compensate for any transforms that have been applied to the scene by the
  // navigator. For instance, a navigator may translate the scene to the right,
  // outside of the screen, in order to show it using a slide animation.
  // In such a case, remove that transform in order to obtain the "real"
  // size and position on the screen.
  if (compensateForTransforms && (ancestor.style != nil)) {
    ABI42_0_0RNSharedElementStyle* style = ancestor.style;
    ABI42_0_0RNSharedElementStyle* otherStyle = otherAncestor ? otherAncestor.style : nil;
    CATransform3D transform = otherStyle ? CATransform3DConcat(style.transform, CATransform3DInvert(otherStyle.transform)) : style.transform;
    if (CATransform3DIsAffine(transform)) {
      CGAffineTransform affineTransform = CATransform3DGetAffineTransform(CATransform3DInvert(transform));
      layout = CGRectApplyAffineTransform(layout, affineTransform);
    } else {
      // Fallback
      layout.origin.x -= transform.m41;
      layout.origin.y -= transform.m42;
    }
  }
  
  // Convert to render overlay coordinates
  return [self.superview convertRect:layout fromView:nil];
}

- (CGRect) getInterpolatedLayout:(CGRect)layout1 layout2:(CGRect)layout2 position:(CGFloat) position
{
  return CGRectMake(
                    layout1.origin.x + ((layout2.origin.x - layout1.origin.x) * position),
                    layout1.origin.y + ((layout2.origin.y - layout1.origin.y) * position),
                    layout1.size.width + ((layout2.size.width - layout1.size.width) * position),
                    layout1.size.height + ((layout2.size.height - layout1.size.height) * position)
                    );
}

- (UIEdgeInsets) getClipInsets:(CGRect)layout visibleLayout:(CGRect)visibleLayout
{
  return UIEdgeInsetsMake(
                          visibleLayout.origin.y - layout.origin.y,
                          visibleLayout.origin.x - layout.origin.x,
                          (layout.origin.y + layout.size.height) - (visibleLayout.origin.y + visibleLayout.size.height),
                          (layout.origin.x + layout.size.width) - (visibleLayout.origin.x + visibleLayout.size.width)
                          );
}

- (UIEdgeInsets) getInterpolatedClipInsets:(CGRect)interpolatedLayout startClipInsets:(UIEdgeInsets)startClipInsets startVisibleLayout:(CGRect)startVisibleLayout endClipInsets:(UIEdgeInsets)endClipInsets endVisibleLayout:(CGRect)endVisibleLayout
{
  UIEdgeInsets clipInsets = UIEdgeInsetsZero;
  
  // Top
  if (!endClipInsets.top && startClipInsets.top && startVisibleLayout.origin.y <= endVisibleLayout.origin.y) {
    clipInsets.top = MAX(0.0f, startVisibleLayout.origin.y - interpolatedLayout.origin.y);
  } else if (!startClipInsets.top && endClipInsets.top && endVisibleLayout.origin.y <= startVisibleLayout.origin.y) {
    clipInsets.top = MAX(0.0f, endVisibleLayout.origin.y - interpolatedLayout.origin.y);
  } else {
    clipInsets.top = startClipInsets.top + ((endClipInsets.top - startClipInsets.top) * _nodePosition);
  }
  
  // Bottom
  if (!endClipInsets.bottom && startClipInsets.bottom && (startVisibleLayout.origin.y + startVisibleLayout.size.height) >= (endVisibleLayout.origin.y + endVisibleLayout.size.height)) {
    clipInsets.bottom = MAX(0.0f, (interpolatedLayout.origin.y + interpolatedLayout.size.height) - (startVisibleLayout.origin.y + startVisibleLayout.size.height));
  } else if (!startClipInsets.bottom && endClipInsets.bottom && (endVisibleLayout.origin.y + endVisibleLayout.size.height) >= (startVisibleLayout.origin.y + startVisibleLayout.size.height)) {
    clipInsets.bottom = MAX(0.0f, (interpolatedLayout.origin.y + interpolatedLayout.size.height) - (endVisibleLayout.origin.y + endVisibleLayout.size.height));
  } else {
    clipInsets.bottom = startClipInsets.bottom + ((endClipInsets.bottom - startClipInsets.bottom) * _nodePosition);
  }
  
  // Left
  if (!endClipInsets.left && startClipInsets.left && startVisibleLayout.origin.x <= endVisibleLayout.origin.x) {
    clipInsets.left = MAX(0.0f, startVisibleLayout.origin.x - interpolatedLayout.origin.x);
  } else if (!startClipInsets.left && endClipInsets.left && endVisibleLayout.origin.x <= startVisibleLayout.origin.x) {
    clipInsets.left = MAX(0.0f, endVisibleLayout.origin.x - interpolatedLayout.origin.x);
  } else {
    clipInsets.left = startClipInsets.left + ((endClipInsets.left - startClipInsets.left) * _nodePosition);
  }
  
  // Right
  if (!endClipInsets.right && startClipInsets.right && (startVisibleLayout.origin.x + startVisibleLayout.size.width) >= (endVisibleLayout.origin.x + endVisibleLayout.size.width)) {
    clipInsets.right = MAX(0.0f, (interpolatedLayout.origin.x + interpolatedLayout.size.width) - (startVisibleLayout.origin.x + startVisibleLayout.size.width));
  } else if (!startClipInsets.right && endClipInsets.right && (endVisibleLayout.origin.x + endVisibleLayout.size.width) >= (startVisibleLayout.origin.x + startVisibleLayout.size.width)) {
    clipInsets.right = MAX(0.0f, (interpolatedLayout.origin.x + interpolatedLayout.size.width) - (endVisibleLayout.origin.x + endVisibleLayout.size.width));
  } else {
    clipInsets.right = startClipInsets.right + ((endClipInsets.right - startClipInsets.right) * _nodePosition);
  }
  
  return clipInsets;
}

- (void) applyStyle:(ABI42_0_0RNSharedElementStyle*)style view:(UIView*)view
{
  CALayer *layer = view.layer;
  
  layer.opacity = style.opacity;
  layer.backgroundColor = style.backgroundColor.CGColor;
  layer.borderWidth = style.borderWidth;
  layer.borderColor = style.borderColor.CGColor;
  layer.shadowOpacity = style.shadowOpacity;
  layer.shadowRadius = style.shadowRadius;
  layer.shadowOffset = style.shadowOffset;
  layer.shadowColor = style.shadowColor.CGColor;
  [style.cornerRadii updateShadowPathForLayer:layer bounds:view.bounds];
  [style.cornerRadii updateClipMaskForLayer:layer bounds:view.bounds];
}

- (void) fireMeasureEvent:(ABI42_0_0RNSharedElementTransitionItem*) item layout:(CGRect)layout visibleLayout:(CGRect)visibleLayout contentLayout:(CGRect)contentLayout
{
  if (!self.onMeasureNode) return;
  ABI42_0_0RCTCornerRadii cornerRadii = [item.style.cornerRadii radiiForBounds:_outerStyleView.bounds];
  NSDictionary* eventData = @{
    @"node": item.name,
    @"layout": @{
        @"x": @(layout.origin.x),
        @"y": @(layout.origin.y),
        @"width": @(layout.size.width),
        @"height": @(layout.size.height),
        @"visibleX": @(visibleLayout.origin.x),
        @"visibleY": @(visibleLayout.origin.y),
        @"visibleWidth": @(visibleLayout.size.width),
        @"visibleHeight": @(visibleLayout.size.height),
        @"contentX": @(contentLayout.origin.x),
        @"contentY": @(contentLayout.origin.y),
        @"contentWidth": @(contentLayout.size.width),
        @"contentHeight": @(contentLayout.size.height),
    },
    @"contentType": item.content ? item.content.typeName : @"none",
    @"style": @{
        @"borderTopLeftRadius": @(cornerRadii.topLeft),
        @"borderTopRightRadius": @(cornerRadii.topRight),
        @"borderBottomLeftRadius": @(cornerRadii.bottomLeft),
        @"borderBotomRightRadius": @(cornerRadii.bottomRight)
    }
  };
  self.onMeasureNode(eventData);
}

- (void) updateStyle
{
  if (!_initialLayoutPassCompleted) return;
  
  // Local data
  ABI42_0_0RNSharedElementTransitionItem* startItem = [_items objectAtIndex:ITEM_START];
  ABI42_0_0RNSharedElementTransitionItem* startAncestor = [_items objectAtIndex:ITEM_START_ANCESTOR];
  ABI42_0_0RNSharedElementTransitionItem* endItem = [_items objectAtIndex:ITEM_END];
  ABI42_0_0RNSharedElementTransitionItem* endAncestor = [_items objectAtIndex:ITEM_END_ANCESTOR];
  ABI42_0_0RNSharedElementStyle* startStyle = startItem.style;
  ABI42_0_0RNSharedElementStyle* endStyle = endItem.style;
  
  // Determine starting scene that is currently visible to the user
  if (_initialVisibleAncestorIndex < 0) {
    ABI42_0_0RNSharedElementStyle* startAncenstorLayout = startAncestor.style;
    ABI42_0_0RNSharedElementStyle* endAncestorStyle = endAncestor.style;
    if (startAncenstorLayout && !endAncestorStyle) {
      _initialVisibleAncestorIndex = 0;
    } else if (!startAncenstorLayout && endAncestorStyle) {
      _initialVisibleAncestorIndex = 1;
    } else if (startAncenstorLayout && endAncestorStyle){
      CGRect startAncestorVisible = CGRectIntersection(self.superview.bounds, [self.superview convertRect:startAncenstorLayout.layout fromView:nil]);
      CGRect endAncestorVisible = CGRectIntersection(self.superview.bounds, [self.superview convertRect:endAncestorStyle.layout fromView:nil]);
      _initialVisibleAncestorIndex = ((endAncestorVisible.size.width * endAncestorVisible.size.height) > (startAncestorVisible.size.width * startAncestorVisible.size.height)) ? 1 : 0;
    }
  }
  
  // Get start layout
  BOOL startCompensate = _initialVisibleAncestorIndex == 1;
  CGRect startLayout = startStyle ? [self normalizeLayout:startStyle.layout compensateForTransforms:startCompensate ancestor:startAncestor otherAncestor:endAncestor] : CGRectZero;
  CGRect startVisibleLayout = startStyle ? [self normalizeLayout:[startItem visibleLayoutForAncestor:startAncestor] compensateForTransforms:startCompensate ancestor:startAncestor otherAncestor:endAncestor] : CGRectZero;
  CGRect startContentLayout = startStyle ? [self normalizeLayout:[startItem contentLayoutForContent:startItem.content] compensateForTransforms:startCompensate ancestor:startAncestor otherAncestor:endAncestor] : CGRectZero;
  UIEdgeInsets startClipInsets = [self getClipInsets:startLayout visibleLayout:startVisibleLayout];
  
  // Get end layout
  BOOL endCompensate = _initialVisibleAncestorIndex == 0;
  CGRect endLayout = endStyle ? [self normalizeLayout:endStyle.layout compensateForTransforms:endCompensate ancestor:endAncestor otherAncestor:startAncestor] : CGRectZero;
  CGRect endVisibleLayout = endStyle ? [self normalizeLayout:[endItem visibleLayoutForAncestor:endAncestor] compensateForTransforms:endCompensate ancestor:endAncestor otherAncestor:startAncestor] : CGRectZero;
  CGRect endContentLayout = endStyle ?  [self normalizeLayout:[endItem contentLayoutForContent:(endItem.content ? endItem.content : startItem.content)] compensateForTransforms:endCompensate ancestor:endAncestor otherAncestor:startAncestor] : CGRectZero;
  UIEdgeInsets endClipInsets = [self getClipInsets:endLayout visibleLayout:endVisibleLayout];
  
  // Get interpolated style & layout
  ABI42_0_0RNSharedElementStyle* interpolatedStyle;
  CGRect interpolatedLayout;
  CGRect interpolatedContentLayout;
  UIEdgeInsets interpolatedClipInsets;
  if (!startStyle && !endStyle) return;
  if (startStyle && endStyle) {
    interpolatedStyle = [ABI42_0_0RNSharedElementStyle getInterpolatedStyle:startStyle style2:endStyle position:_nodePosition];
    interpolatedLayout = [self getInterpolatedLayout:startLayout layout2:endLayout position:_nodePosition];
    interpolatedClipInsets = [self getInterpolatedClipInsets:interpolatedLayout startClipInsets:startClipInsets startVisibleLayout:startVisibleLayout endClipInsets:endClipInsets endVisibleLayout:endVisibleLayout];
    interpolatedContentLayout = [self getInterpolatedLayout:startContentLayout layout2:endContentLayout position:_nodePosition];
  } else if (startStyle) {
    interpolatedStyle = startStyle;
    interpolatedLayout = startLayout;
    interpolatedClipInsets = startClipInsets;
    interpolatedContentLayout = startContentLayout;
  } else {
    interpolatedStyle = endStyle;
    interpolatedLayout = endLayout;
    interpolatedClipInsets = endClipInsets;
    interpolatedContentLayout = endContentLayout;
  }
  
  // Update frame
  CGRect parentBounds = self.superview.bounds;
  [super ABI42_0_0ReactSetFrame:parentBounds];
  
  // Update clipping mask (handles scrollview/parent clipping)
  // This kind of clipping is performed at the top level.
  CGFloat clipLeft = interpolatedClipInsets.left != 0.0f ? interpolatedClipInsets.left + interpolatedLayout.origin.x : 0.0f;
  CGFloat clipTop = interpolatedClipInsets.top != 0.0f ? interpolatedClipInsets.top + interpolatedLayout.origin.y : 0.0f;
  CGFloat clipBottom = interpolatedClipInsets.bottom != 0.0f ? parentBounds.size.height - (interpolatedLayout.origin.y + interpolatedLayout.size.height) + interpolatedClipInsets.bottom : 0.0f;
  CGFloat clipRight = interpolatedClipInsets.right != 0.0f ? parentBounds.size.width - (interpolatedLayout.origin.x + interpolatedLayout.size.width) + interpolatedClipInsets.right : 0.0f;
  CGRect clipFrame = CGRectMake(
                                clipLeft,
                                clipTop,
                                parentBounds.size.width - clipLeft - clipRight,
                                parentBounds.size.height - clipTop - clipBottom);
  CALayer *maskLayer = [[CALayer alloc] init];
  maskLayer.backgroundColor = [UIColor whiteColor].CGColor;
  maskLayer.frame = clipFrame;
  self.layer.mask = maskLayer;
  
  // Update outer style view. This view has all styles such as border-color,
  // background color, and shadow. Because of the shadow, the view itsself
  // does not mask its bounds, otherwise the shadow isn't visible.
  _outerStyleView.frame = interpolatedLayout;
  [self applyStyle:interpolatedStyle view:_outerStyleView];
  
  // Update inner clip view. This view holds the image/content views
  // inside and clips their content.
  CGRect innerClipFrame = interpolatedLayout;
  innerClipFrame.origin.x = 0;
  innerClipFrame.origin.y = 0;
  _innerClipView.frame = innerClipFrame;
  [interpolatedStyle.cornerRadii updateClipMaskForLayer:_innerClipView.layer bounds:_innerClipView.bounds];
  _innerClipView.layer.masksToBounds = _resize != ABI42_0_0RNSharedElementResizeNone;
  
  // Update content
  UIView* contentView1 = (startItem.content && startItem.content.type == ABI42_0_0RNSharedElementContentTypeSnapshotView) ? startItem.content.data : _primaryImageView;
  if (contentView1.superview != _innerClipView) [_innerClipView addSubview:contentView1];
  if (_animation == ABI42_0_0RNSharedElementAnimationMove) {
    
    // In case of move, we correctly calculate the content-frame
    // and interpolate between the start- and end-state, assuming
    // that the start- and end-content (image) has the same aspect-ratio
    CGRect contentFrame = interpolatedContentLayout;
    contentFrame.origin.x -= interpolatedLayout.origin.x;
    contentFrame.origin.y -= interpolatedLayout.origin.y;
    contentView1.frame = contentFrame;
  }
  else {
    // Update content-view 2
    UIView* contentView2 = (endItem.content && endItem.content.type == ABI42_0_0RNSharedElementContentTypeSnapshotView) ? endItem.content.data : _secondaryImageView;
    if (contentView2.superview != _innerClipView) [_innerClipView addSubview:contentView2];
    
    // In all other cases, animate and interpolate both the start- and
    // end views to look like each other
    CGRect startContentLayout2 = startStyle ? [ABI42_0_0RNSharedElementContent layoutForRect:endStyle ? endContentLayout : startContentLayout content:startItem.content contentMode:startStyle.contentMode reverse:YES] : CGRectZero;
    CGRect endContentLayout1 = endStyle ? [ABI42_0_0RNSharedElementContent layoutForRect:startStyle ? startContentLayout : endContentLayout content:endItem.content contentMode:endStyle.contentMode reverse:YES] : CGRectZero;
    
    // Calculate interpolated layout
    CGRect startInterpolatedContentLayout = [self getInterpolatedLayout:startContentLayout layout2:startContentLayout2 position:_nodePosition];
    CGRect endInterpolatedContentLayout = [self getInterpolatedLayout:endContentLayout1 layout2:endContentLayout position:_nodePosition];
    
    // Calculate new size
    switch (_resize) {
      case ABI42_0_0RNSharedElementResizeAuto:
        // Nothing to do
        break;
      case ABI42_0_0RNSharedElementResizeStretch:
        // TODO
        break;
      case ABI42_0_0RNSharedElementResizeClip:
      case ABI42_0_0RNSharedElementResizeNone:
        startInterpolatedContentLayout.size = startContentLayout.size;
        endInterpolatedContentLayout.size = endContentLayout.size;
        break;
    }
    
    // Calculate new origin
    switch (_align) {
      case ABI42_0_0RNSharedElementAlignLeftTop:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case ABI42_0_0RNSharedElementAlignLeftCenter:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case ABI42_0_0RNSharedElementAlignLeftBottom:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - startInterpolatedContentLayout.size.height;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - endInterpolatedContentLayout.size.height;
        break;
      case ABI42_0_0RNSharedElementAlignRightTop:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case ABI42_0_0RNSharedElementAlignRightCenter:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case ABI42_0_0RNSharedElementAlignRightBottom:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - startInterpolatedContentLayout.size.height;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - endInterpolatedContentLayout.size.height;
        break;
      case ABI42_0_0RNSharedElementAlignCenterTop:
        startInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - startInterpolatedContentLayout.size.width) / 2;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - endInterpolatedContentLayout.size.width) / 2;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case ABI42_0_0RNSharedElementAlignAuto:
      case ABI42_0_0RNSharedElementAlignCenterCenter:
        startInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - startInterpolatedContentLayout.size.width) / 2;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - endInterpolatedContentLayout.size.width) / 2;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case ABI42_0_0RNSharedElementAlignCenterBottom:
        startInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - startInterpolatedContentLayout.size.width) / 2;
        startInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - startInterpolatedContentLayout.size.height;
        endInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - endInterpolatedContentLayout.size.width) / 2;
        endInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - endInterpolatedContentLayout.size.height;
        break;
    }
    
    // Update start node
    contentView1.frame = startInterpolatedContentLayout;
    
    // Update end node
    contentView2.frame = endInterpolatedContentLayout;
    
    // Fade
    if (_animation == ABI42_0_0RNSharedElementAnimationFadeIn) {
      // Fade-in
      contentView1.layer.opacity = 0.0f;
      contentView2.layer.opacity = MIN(MAX(_nodePosition, 0.0f), 1.0f);
    }
    else if (_animation == ABI42_0_0RNSharedElementAnimationFadeOut) {
      // Fade-out
      contentView1.layer.opacity = 1.0f - MIN(MAX(_nodePosition, 0.0f), 1.0f);
      contentView2.layer.opacity = 0.0f;
    }
    else {
      // Cross-fade
      contentView1.layer.opacity = 1.0f - MIN(MAX(_nodePosition, 0.0f), 1.0f);
      contentView2.layer.opacity = MIN(MAX(_nodePosition, 0.0f), 1.0f);
    }
  }
  
  // Fire events
  if ((startAncestor.style != nil) && !startAncestor.hasCalledOnMeasure) {
    startAncestor.hasCalledOnMeasure = YES;
    startItem.hasCalledOnMeasure = NO;
    CGRect ancestorLayout = [self.superview convertRect:startAncestor.style.layout fromView:nil];
    [self fireMeasureEvent:startAncestor layout:ancestorLayout visibleLayout:ancestorLayout contentLayout:ancestorLayout];
  }
  if ((startItem.style != nil) && !startItem.hasCalledOnMeasure) {
    startItem.hasCalledOnMeasure = YES;
    [self fireMeasureEvent:startItem layout:startLayout visibleLayout:startVisibleLayout contentLayout:startContentLayout];
  }
  if ((endAncestor.style != nil) && !endAncestor.hasCalledOnMeasure) {
    endAncestor.hasCalledOnMeasure = YES;
    endItem.hasCalledOnMeasure = NO;
    CGRect ancestorLayout = [self.superview convertRect:endAncestor.style.layout fromView:nil];
    [self fireMeasureEvent:endAncestor layout:ancestorLayout visibleLayout:ancestorLayout contentLayout:ancestorLayout];
  }
  if ((endItem.style != nil) && !endItem.hasCalledOnMeasure) {
    endItem.hasCalledOnMeasure = YES;
    [self fireMeasureEvent:endItem layout:endLayout visibleLayout:endVisibleLayout contentLayout:endContentLayout];
  }
}

- (void) ABI42_0_0ReactSetFrame:(CGRect)frame
{
  // Only after the frame bounds have been set by the ABI42_0_0RN layout-system
  // we schedule a layout-fetch to run after these updates to ensure
  // that Yoga/UIManager has finished the initial layout pass.
  if (_ABI42_0_0ReactFrameSet == NO) {
    //NSLog(@"ABI42_0_0ReactSetFrame: %@", NSStringFromCGRect(frame));
    _ABI42_0_0ReactFrameSet = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      for (ABI42_0_0RNSharedElementTransitionItem* item in self->_items) {
        if (item.needsLayout) {
          item.needsLayout = NO;
          [item.node requestStyle:self];
        }
        if (item.needsContent) {
          item.needsContent = NO;
          [item.node requestContent:self];
        }
      }
      self->_initialLayoutPassCompleted = YES;
      [self updateStyle];
      [self updateNodeVisibility];
    });
  }
  
  // When ABI42_0_0React attempts to change the frame on this view,
  // override that and apply our own measured frame and styles
  [self updateStyle];
  [self updateNodeVisibility];
}

@end
