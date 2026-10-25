#import "ExpoSelectableTextComponentView.h"
#import "ExpoSelectableTextSelectionView.h"

#import <React/RCTLog.h>
#import <jsi/jsi.h>
#import <react/renderer/components/exposelectabletext/ExpoSelectableTextComponentDescriptor.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/textlayoutmanager/RCTTextLayoutManager.h>

using namespace facebook;
using namespace facebook::react;

// The TextKit setup that `RCTParagraphTextView` draws with. The selection view
// lays out with the same call, so its glyphs land on the drawn glyphs.
@interface RCTTextLayoutManager (ExpoSelectableText)

- (NSTextStorage *)_textStorageAndLayoutManagerWithAttributesString:(NSAttributedString *)attributedString
                                                paragraphAttributes:(ParagraphAttributes)paragraphAttributes
                                                               size:(CGSize)size;

@end

@interface RCTParagraphComponentView (ExpoSelectableText)

- (void)enableContextMenu;
- (void)disableContextMenu;

@end

NSArray<NSString *> *ExpoSelectableTextMissingReactNativeHooks(void)
{
  NSMutableArray<NSString *> *missing = [NSMutableArray new];
  if (![RCTParagraphComponentView instancesRespondToSelector:@selector(enableContextMenu)]) {
    [missing addObject:@"-[RCTParagraphComponentView enableContextMenu]"];
  }
  if (![RCTParagraphComponentView instancesRespondToSelector:@selector(disableContextMenu)]) {
    [missing addObject:@"-[RCTParagraphComponentView disableContextMenu]"];
  }
  if (![NSClassFromString(@"RCTParagraphTextView") instancesRespondToSelector:NSSelectorFromString(@"drawingFrame")]) {
    [missing addObject:@"-[RCTParagraphTextView drawingFrame]"];
  }
  if (![RCTTextLayoutManager instancesRespondToSelector:@selector
                             (_textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:)]) {
    [missing addObject:@"-[RCTTextLayoutManager _textStorageAndLayoutManagerWithAttributesString:paragraphAttributes:size:]"];
  }
  return missing;
}

// The selection layer depends on private React Native internals. When an
// upgrade removes one of them, the view keeps React Native's own copy menu.
static BOOL ExpoSelectableTextCanUseSelectionLayer(void)
{
  static BOOL canUseSelectionLayer;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSArray<NSString *> *missing = ExpoSelectableTextMissingReactNativeHooks();
    canUseSelectionLayer = missing.count == 0;
    if (!canUseSelectionLayer) {
      RCTLogWarn(
          @"ExpoSelectableText could not enable range selection because this React Native version does not have the paragraph internals it uses. Selectable text falls back to the React Native copy menu, and Text.Menu items are not shown. Use a version of expo-selectable-text that supports this React Native version. Missing: %@",
          [missing componentsJoinedByString:@", "]);
    }
  });
  return canUseSelectionLayer;
}

@implementation ExpoSelectableTextComponentView {
  BOOL _selectionEnabled;
  ExpoSelectableTextSelectionView *_selectionView;
  RCTTextLayoutManager *_selectionLayoutManager;
  NSAttributedString *_selectionLayoutText;
  CGSize _selectionLayoutSize;
  ParagraphAttributes _selectionParagraphAttributes;
  NSArray<NSDictionary *> *_menuItems;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _menuItems = @[];
  }
  return self;
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ExpoSelectableTextComponentDescriptor>();
}

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  if ([commandName isEqualToString:@"setMenuItems"]) {
    NSArray *items = args.count > 0 && [args[0] isKindOfClass:NSArray.class] ? args[0] : @[];
    _menuItems = [items copy];
    _selectionView.menuItems = _menuItems;
    return;
  }
  [super handleCommand:commandName args:args];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];
  // `_selectionEnabled` stays, like the paragraph's `_props`: when the next
  // paragraph is selectable too, `updateProps:` does not enable it again.
  [self _removeSelectionView];
  _menuItems = @[];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (_selectionView != nil) {
    [self _updateSelectionView];
  }
}

// The selection view costs a text view and a second TextKit layout, so it is
// made when a touch first reaches the paragraph, not for every paragraph on
// screen. UIKit hit-tests before it assigns the touch, so the same touch goes to
// the new view and its long press can start a selection.
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  if (_selectionEnabled && _selectionView == nil && [self pointInside:point withEvent:event]) {
    [self _updateSelectionView];
  }
  return [super hitTest:point withEvent:event];
}

#pragma mark - Selection

// `RCTParagraphComponentView` calls these two when `selectable` changes. They
// replace its long press, which copies the whole paragraph, with range selection.
- (void)enableContextMenu
{
  if (!ExpoSelectableTextCanUseSelectionLayer()) {
    [super enableContextMenu];
    return;
  }
  _selectionEnabled = YES;
}

- (void)disableContextMenu
{
  if (!ExpoSelectableTextCanUseSelectionLayer()) {
    [super disableContextMenu];
    return;
  }
  _selectionEnabled = NO;
  [self _removeSelectionView];
  _selectionLayoutManager = nil;
}

// The selection view is the responder, and it copies only the selected range.
- (BOOL)canBecomeFirstResponder
{
  if (!ExpoSelectableTextCanUseSelectionLayer()) {
    return [super canBecomeFirstResponder];
  }
  return NO;
}

- (BOOL)canPerformAction:(SEL)action withSender:(id)sender
{
  if (!ExpoSelectableTextCanUseSelectionLayer()) {
    return [super canPerformAction:action withSender:sender];
  }
  return action != @selector(copy:) && [super canPerformAction:action withSender:sender];
}

- (SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point
{
  // A drag of a selection handle often starts on a pressable <Text>. Adjusting
  // the selection must not press it.
  if (_selectionView.selectedRange.length > 0) {
    return nullptr;
  }
  return [super touchEventEmitterAtPoint:point];
}

- (void)_updateSelectionView
{
  UIView *contentView = self.contentView;
  NSAttributedString *attributedText = self.attributedText;
  SEL drawingFrameSelector = NSSelectorFromString(@"drawingFrame");
  if (attributedText.length == 0 || contentView.superview == nil ||
      ![contentView respondsToSelector:drawingFrameSelector]) {
    [self _removeSelectionView];
    return;
  }

  // `RCTParagraphTextView` stores the frame it draws the glyphs into, after its
  // compressed line height adjustment. Reading it keeps one source of truth.
  CGRect drawingFrame = [[contentView valueForKey:@"drawingFrame"] CGRectValue];
  drawingFrame = CGRectOffset(drawingFrame, contentView.frame.origin.x, contentView.frame.origin.y);
  if (CGRectIsEmpty(drawingFrame)) {
    [self _removeSelectionView];
    return;
  }

  // A press on a nested pressable <Text> paints a highlight. Comparing the
  // unpainted string keeps that from rebuilding the view in the middle of a touch.
  NSAttributedString *layoutText = ExpoSelectableTextUnpaintedString(attributedText);
  const auto &paragraphAttributes = static_cast<const ParagraphProps &>(*_props).paragraphAttributes;
  // `UITextView` binds its text container at initialization. The container's line
  // limit and break mode come from the paragraph attributes, so a change of those
  // needs a new view.
  BOOL needsNewView = _selectionView == nil || !(paragraphAttributes == _selectionParagraphAttributes);
  BOOL layoutChanged = ![layoutText isEqualToAttributedString:_selectionLayoutText] ||
      !CGSizeEqualToSize(drawingFrame.size, _selectionLayoutSize);

  if (needsNewView || layoutChanged) {
    if (_selectionLayoutManager == nil) {
      _selectionLayoutManager = [RCTTextLayoutManager new];
    }
    NSTextStorage *textStorage =
        [_selectionLayoutManager _textStorageAndLayoutManagerWithAttributesString:layoutText
                                                              paragraphAttributes:paragraphAttributes
                                                                             size:drawingFrame.size];
    if (needsNewView) {
      [_selectionView removeFromSuperview];
      _selectionView = [[ExpoSelectableTextSelectionView alloc]
          initWithFrame:drawingFrame
          textContainer:textStorage.layoutManagers.firstObject.textContainers.firstObject];
      _selectionView.menuItems = _menuItems;
      __weak __typeof(self) weakSelf = self;
      _selectionView.onMenuAction = ^(NSString *actionId, NSRange range) {
        [weakSelf _dispatchMenuAction:actionId range:range];
      };
      // Under the drawn text. `RCTParagraphTextView` returns nil from `hitTest:`,
      // so the selection view gets the touches.
      [contentView.superview insertSubview:_selectionView belowSubview:contentView];
      _selectionParagraphAttributes = paragraphAttributes;
    } else {
      // Text that streams in changes on every update. Updating the text view in
      // place keeps the selection and a gesture that is in progress.
      NSRange selectedRange = _selectionView.selectedRange;
      _selectionView.textContainer.size = drawingFrame.size;
      [_selectionView.textStorage setAttributedString:textStorage];
      if (selectedRange.length > 0 && NSMaxRange(selectedRange) <= textStorage.length) {
        _selectionView.selectedRange = selectedRange;
      }
    }
    _selectionLayoutText = [layoutText copy];
    _selectionLayoutSize = drawingFrame.size;
  }

  _selectionView.frame = drawingFrame;
  _selectionView.sourceAttributedText = attributedText;
}

- (void)_removeSelectionView
{
  [_selectionView removeFromSuperview];
  _selectionView = nil;
  _selectionLayoutText = nil;
  _selectionLayoutSize = CGSizeZero;
}

#pragma mark - Events

- (void)_dispatchMenuAction:(NSString *)actionId range:(NSRange)range
{
  NSString *text = self.attributedText.string;
  if (!_eventEmitter || NSMaxRange(range) > text.length) {
    return;
  }

  std::string actionIdString = actionId.UTF8String ?: "";
  std::string selectedText = [text substringWithRange:range].UTF8String ?: "";
  int start = static_cast<int>(range.location);
  int end = static_cast<int>(NSMaxRange(range));

  _eventEmitter->dispatchEvent("menuAction", [=](jsi::Runtime &runtime) {
    auto payload = jsi::Object(runtime);
    payload.setProperty(runtime, "id", jsi::String::createFromUtf8(runtime, actionIdString));
    payload.setProperty(runtime, "selectedText", jsi::String::createFromUtf8(runtime, selectedText));
    payload.setProperty(runtime, "start", start);
    payload.setProperty(runtime, "end", end);
    return jsi::Value(std::move(payload));
  });
}

@end
