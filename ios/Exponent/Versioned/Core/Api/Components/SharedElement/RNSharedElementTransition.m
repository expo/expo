//
//  RNSharedElementTransition.m
//  react-native-shared-element
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreImage/CoreImage.h>
#import <React/RCTDefines.h>
#import <React/UIView+React.h>
#import "RNSharedElementTransition.h"
#import "RNSharedElementTransitionItem.h"

#define ITEM_START_ANCESTOR 0
#define ITEM_END_ANCESTOR 1
#define ITEM_START 2
#define ITEM_END 3

#ifdef DEBUG
#define DebugLog(...) NSLog(__VA_ARGS__)
#else
#define DebugLog(...) (void)0
#endif

@implementation RNSharedElementTransition
{
  NSArray* _items;
  UIView* _outerStyleView;
  UIView* _innerClipView;
  UIImageView* _primaryImageView;
  UIImageView* _secondaryImageView;
  BOOL _reactFrameSet;
  BOOL _initialLayoutPassCompleted;
  int _initialVisibleAncestorIndex;
}

- (instancetype)initWithNodeManager:(RNSharedElementNodeManager*)nodeManager
{
  if ((self = [super init])) {
    _items = @[
      [[RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"startAncestor" isAncestor:YES],
      [[RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"endAncestor" isAncestor:YES],
      [[RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"startNode" isAncestor:NO],
      [[RNSharedElementTransitionItem alloc]initWithNodeManager:nodeManager name:@"endNode" isAncestor:NO]
    ];
    _nodePosition = 0.0f;
    _animation = RNSharedElementAnimationMove;
    _resize = RNSharedElementResizeStretch;
    _align = RNSharedElementAlignCenterCenter;
    _reactFrameSet = NO;
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
  
  for (RNSharedElementTransitionItem* item in _items) {
    if (item.node != nil) [item.node cancelRequests:self];
  }
}

- (void)dealloc
{
  for (RNSharedElementTransitionItem* item in _items) {
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

- (RNSharedElementTransitionItem*) findItemForNode:(RNSharedElementNode*) node
{
  for (RNSharedElementTransitionItem* item in _items) {
    if (item.node == node) {
      return item;
    }
  }
  return nil;
}

- (void)setStartNode:(RNSharedElementNode *)startNode
{
  ((RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_START]).node = startNode;
}

- (void)setEndNode:(RNSharedElementNode *)endNode
{
  ((RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_END]).node = endNode;
}

- (void)setStartAncestor:(RNSharedElementNode *)startNodeAncestor
{
  ((RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_START_ANCESTOR]).node = startNodeAncestor;
}

- (void)setEndAncestor:(RNSharedElementNode *)endNodeAncestor
{
  ((RNSharedElementTransitionItem*)[_items objectAtIndex:ITEM_END_ANCESTOR]).node = endNodeAncestor;
}

- (void)setNodePosition:(CGFloat)nodePosition
{
  if (_nodePosition != nodePosition) {
    _nodePosition = nodePosition;
    [self updateStyle];
  }
}

- (void) setAnimation:(RNSharedElementAnimation)animation
{
  if (_animation != animation) {
    _animation = animation;
    [self updateStyle];
  }
}

- (void) setResize:(RNSharedElementResize)resize
{
  if (_resize != resize) {
    _resize = resize;
    [self updateStyle];
  }
}

- (void) setAlign:(RNSharedElementAlign)align
{
  if (_align != align) {
    _align = align;
    [self updateStyle];
  }
}

- (void)updateNodeVisibility
{
  for (RNSharedElementTransitionItem* item in _items) {
    BOOL hidden = _initialLayoutPassCompleted && item.style != nil && item.content != nil;
    if (hidden && (_animation == RNSharedElementAnimationFadeIn) && [item.name isEqualToString:@"startNode"]) hidden = NO;
    if (hidden && (_animation == RNSharedElementAnimationFadeOut) && [item.name isEqualToString:@"endNode"]) hidden = NO;
    item.hidden = hidden;
  }
}

- (void) didSetProps:(NSArray<NSString *> *)changedProps
{
  for (RNSharedElementTransitionItem* item in _items) {
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

- (void) didLoadContent:(RNSharedElementContent*)content node:(id)node
{
  // NSLog(@"didLoadContent: %@", content);
  RNSharedElementTransitionItem* item = [self findItemForNode:node];
  if (item == nil) return;
  item.content = content;
  if ((content.type == RNSharedElementContentTypeSnapshotImage) || (content.type == RNSharedElementContentTypeRawImage)) {
    UIImage* image = (UIImage*) content.data;
    if (_animation == RNSharedElementAnimationMove) {
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

- (void) didLoadStyle:(RNSharedElementStyle *)style node:(RNSharedElementNode*)node
{
  // NSLog(@"didLoadStyle: %@", NSStringFromCGRect(style.layout));
  RNSharedElementTransitionItem* item = [self findItemForNode:node];
  if (item == nil) return;
  item.style = style;
  [self updateStyle];
  [self updateNodeVisibility];
}

- (CGRect)normalizeLayout:(CGRect)layout
  compensateForTransforms:(BOOL)compensateForTransforms
                 ancestor:(RNSharedElementTransitionItem*)ancestor
            otherAncestor:(RNSharedElementTransitionItem*)otherAncestor

{
  // Compensate for any transforms that have been applied to the scene by the
  // navigator. For instance, a navigator may translate the scene to the right,
  // outside of the screen, in order to show it using a slide animation.
  // In such a case, remove that transform in order to obtain the "real"
  // size and position on the screen.
  if (compensateForTransforms && (ancestor.style != nil)) {
    
    // Calculate "real" size and position of the ancestor (undo its transform)
    RNSharedElementStyle* ancestorStyle = ancestor.style;
    RNSharedElementStyle* otherAncestorStyle = otherAncestor ? otherAncestor.style : nil;
    CATransform3D transform = otherAncestorStyle ? CATransform3DConcat(ancestorStyle.transform, CATransform3DInvert(otherAncestorStyle.transform)) : ancestorStyle.transform;
    CGRect ancestorLayout = ancestorStyle.layout;
    CGRect normalizedAncestorLayout = ancestorLayout;
    if (CATransform3DIsAffine(transform)) {
      CGAffineTransform affineTransform = CATransform3DGetAffineTransform(CATransform3DInvert(transform));
      // Apply the transform on the center
      normalizedAncestorLayout.origin = CGPointMake((ancestorLayout.size.width / -2.0), (ancestorLayout.size.height / -2.0));
      CGPoint diff = CGPointMake(ancestorLayout.origin.x - normalizedAncestorLayout.origin.x, ancestorLayout.origin.y - normalizedAncestorLayout.origin.y);
      normalizedAncestorLayout = CGRectApplyAffineTransform(normalizedAncestorLayout, affineTransform);
      // Undo centering
      normalizedAncestorLayout.origin = CGPointMake(normalizedAncestorLayout.origin.x + diff.x,normalizedAncestorLayout.origin.y + diff.y);
    } else {
      // Fallback, supports only translation
      normalizedAncestorLayout.origin.x -= transform.m41;
      normalizedAncestorLayout.origin.y -= transform.m42;
    }
    
    // Calculate size and position of element within the normalized ancestor
    CGFloat scaleX = normalizedAncestorLayout.size.width / ancestorLayout.size.width;
    CGFloat scaleY = normalizedAncestorLayout.size.height / ancestorLayout.size.height;
    layout = CGRectMake(
      ((layout.origin.x - ancestorLayout.origin.x) * scaleX) + normalizedAncestorLayout.origin.x,
      ((layout.origin.y - ancestorLayout.origin.y) * scaleY) + normalizedAncestorLayout.origin.y,
      layout.size.width * scaleX,
      layout.size.height * scaleY
    );
  }
  
  // Convert to render overlay coordinates
  return [self.superview convertRect:layout fromView:nil];
}

- (CGFloat) getAncestorVisibility:(RNSharedElementStyle*)ancestorStyle
{
  CGRect intersection = CGRectIntersection(self.superview.bounds, [self.superview convertRect:ancestorStyle.layout fromView:nil]);
  if (CGRectIsNull(intersection)) return 0;
  CGFloat superVolume = self.superview.bounds.size.width * self.superview.bounds.size.height;
  CGFloat intersectionVolume = intersection.size.width * intersection.size.height;
  CGFloat ancestorVolume = ancestorStyle.layout.size.width * ancestorStyle.layout.size.height;
  return (intersectionVolume / superVolume) * (intersectionVolume / ancestorVolume);
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

- (void) applyStyle:(RNSharedElementStyle*)style view:(UIView*)view
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

- (void) fireMeasureEvent:(RNSharedElementTransitionItem*) item layout:(CGRect)layout visibleLayout:(CGRect)visibleLayout contentLayout:(CGRect)contentLayout
{
  if (!self.onMeasureNode) return;
  RCTCornerRadii cornerRadii = [item.style.cornerRadii radiiForBounds:_outerStyleView.bounds];
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
  RNSharedElementTransitionItem* startItem = [_items objectAtIndex:ITEM_START];
  RNSharedElementTransitionItem* startAncestor = [_items objectAtIndex:ITEM_START_ANCESTOR];
  RNSharedElementTransitionItem* endItem = [_items objectAtIndex:ITEM_END];
  RNSharedElementTransitionItem* endAncestor = [_items objectAtIndex:ITEM_END_ANCESTOR];
  RNSharedElementStyle* startStyle = startItem.style;
  RNSharedElementStyle* endStyle = endItem.style;
  
  // Determine starting scene that is currently visible to the user
  if (_initialVisibleAncestorIndex < 0) {
    RNSharedElementStyle* startAncenstorStyle = startAncestor.style;
    RNSharedElementStyle* endAncestorStyle = endAncestor.style;
    if (startAncenstorStyle && !endAncestorStyle) {
      _initialVisibleAncestorIndex = 0;
    } else if (!startAncenstorStyle && endAncestorStyle) {
      _initialVisibleAncestorIndex = 1;
    } else if (startAncenstorStyle && endAncestorStyle){
      CGFloat startAncestorVisibility = [self getAncestorVisibility:startAncenstorStyle];
      CGFloat endAncestorVisibility = [self getAncestorVisibility:endAncestorStyle];
      _initialVisibleAncestorIndex = endAncestorVisibility > startAncestorVisibility ? 1 : 0;
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
  RNSharedElementStyle* interpolatedStyle;
  CGRect interpolatedLayout;
  CGRect interpolatedContentLayout;
  UIEdgeInsets interpolatedClipInsets;
  if (!startStyle && !endStyle) return;
  if (startStyle && endStyle) {
    interpolatedStyle = [RNSharedElementStyle getInterpolatedStyle:startStyle style2:endStyle position:_nodePosition];
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
  [super reactSetFrame:parentBounds];
  
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
  _innerClipView.layer.masksToBounds = _resize != RNSharedElementResizeNone;
  
  // Update content
  UIView* contentView1 = (startItem.content && startItem.content.type == RNSharedElementContentTypeSnapshotView) ? startItem.content.data : _primaryImageView;
  if (contentView1.superview != _innerClipView) [_innerClipView addSubview:contentView1];
  if (_animation == RNSharedElementAnimationMove) {
    
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
    UIView* contentView2 = (endItem.content && endItem.content.type == RNSharedElementContentTypeSnapshotView) ? endItem.content.data : _secondaryImageView;
    if (contentView2.superview != _innerClipView) [_innerClipView addSubview:contentView2];
    
    // In all other cases, animate and interpolate both the start- and
    // end views to look like each other
    CGRect startContentLayout2 = startStyle ? [RNSharedElementContent layoutForRect:endStyle ? endContentLayout : startContentLayout content:startItem.content contentMode:startStyle.contentMode reverse:YES] : CGRectZero;
    CGRect endContentLayout1 = endStyle ? [RNSharedElementContent layoutForRect:startStyle ? startContentLayout : endContentLayout content:endItem.content contentMode:endStyle.contentMode reverse:YES] : CGRectZero;
    
    // Calculate interpolated layout
    CGRect startInterpolatedContentLayout = [self getInterpolatedLayout:startContentLayout layout2:startContentLayout2 position:_nodePosition];
    CGRect endInterpolatedContentLayout = [self getInterpolatedLayout:endContentLayout1 layout2:endContentLayout position:_nodePosition];
    
    // Calculate new size
    switch (_resize) {
      case RNSharedElementResizeAuto:
        // Nothing to do
        break;
      case RNSharedElementResizeStretch:
        // TODO
        break;
      case RNSharedElementResizeClip:
      case RNSharedElementResizeNone:
        startInterpolatedContentLayout.size = startContentLayout.size;
        endInterpolatedContentLayout.size = endContentLayout.size;
        break;
    }
    
    // Calculate new origin
    switch (_align) {
      case RNSharedElementAlignLeftTop:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case RNSharedElementAlignLeftCenter:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case RNSharedElementAlignLeftBottom:
        startInterpolatedContentLayout.origin.x = 0;
        startInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - startInterpolatedContentLayout.size.height;
        endInterpolatedContentLayout.origin.x = 0;
        endInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - endInterpolatedContentLayout.size.height;
        break;
      case RNSharedElementAlignRightTop:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case RNSharedElementAlignRightCenter:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case RNSharedElementAlignRightBottom:
        startInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - startInterpolatedContentLayout.size.width;
        startInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - startInterpolatedContentLayout.size.height;
        endInterpolatedContentLayout.origin.x = interpolatedLayout.size.width - endInterpolatedContentLayout.size.width;
        endInterpolatedContentLayout.origin.y = interpolatedLayout.size.height - endInterpolatedContentLayout.size.height;
        break;
      case RNSharedElementAlignCenterTop:
        startInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - startInterpolatedContentLayout.size.width) / 2;
        startInterpolatedContentLayout.origin.y = 0;
        endInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - endInterpolatedContentLayout.size.width) / 2;
        endInterpolatedContentLayout.origin.y = 0;
        break;
      case RNSharedElementAlignAuto:
      case RNSharedElementAlignCenterCenter:
        startInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - startInterpolatedContentLayout.size.width) / 2;
        startInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - startInterpolatedContentLayout.size.height) / 2;
        endInterpolatedContentLayout.origin.x = (interpolatedLayout.size.width - endInterpolatedContentLayout.size.width) / 2;
        endInterpolatedContentLayout.origin.y = (interpolatedLayout.size.height - endInterpolatedContentLayout.size.height) / 2;
        break;
      case RNSharedElementAlignCenterBottom:
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
    if (_animation == RNSharedElementAnimationFadeIn) {
      // Fade-in
      contentView1.layer.opacity = 0.0f;
      contentView2.layer.opacity = MIN(MAX(_nodePosition, 0.0f), 1.0f);
    }
    else if (_animation == RNSharedElementAnimationFadeOut) {
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

- (void) reactSetFrame:(CGRect)frame
{
  // Only after the frame bounds have been set by the RN layout-system
  // we schedule a layout-fetch to run after these updates to ensure
  // that Yoga/UIManager has finished the initial layout pass.
  if (_reactFrameSet == NO) {
    //NSLog(@"reactSetFrame: %@", NSStringFromCGRect(frame));
    _reactFrameSet = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
      for (RNSharedElementTransitionItem* item in self->_items) {
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
  
  // When react attempts to change the frame on this view,
  // override that and apply our own measured frame and styles
  [self updateStyle];
  [self updateNodeVisibility];
}

@end
