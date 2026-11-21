// Copyright 2015-present 650 Industries. All rights reserved.

#import <TargetConditionals.h>

#if !TARGET_OS_TV

#import "SplashScreenSnapshot.h"

#import <objc/runtime.h>

#import <React/RCTParagraphComponentView.h>
#import <React/RCTViewComponentView.h>

#import <react/renderer/attributedstring/conversions.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/view/ViewProps.h>

using namespace facebook::react;

namespace {

/// Colors go into the template the way React's `processColor` sends them: ARGB in one integer.
folly::dynamic colorToDynamic(const SharedColor &color)
{
  uint32_t argb = ((uint32_t)alphaFromColor(color) << 24) | ((uint32_t)redFromColor(color) << 16) |
      ((uint32_t)greenFromColor(color) << 8) | (uint32_t)blueFromColor(color);
  return folly::dynamic((int64_t)argb);
}

folly::dynamic colorToDynamic(UIColor *color)
{
  CGFloat r = 0, g = 0, b = 0, a = 0;
  if (!color || !([color getRed:&r green:&g blue:&b alpha:&a] || ([color getWhite:&r alpha:&a] && ((g = b = r), true))) ||
      a <= 0) {
    return nullptr;
  }
  auto channel = [](CGFloat value) { return (uint32_t)std::lround(std::clamp(value, (CGFloat)0, (CGFloat)1) * 255); };
  return folly::dynamic((int64_t)((channel(a) << 24) | (channel(r) << 16) | (channel(g) << 8) | channel(b)));
}

void setColor(folly::dynamic &out, const char *key, UIColor *color)
{
  auto value = colorToDynamic(color);
  if (!value.isNull()) {
    out[key] = std::move(value);
  }
}

/// `fontWeight` as CSS weight, from the font's weight trait (the closest of UIKit's named weights).
int fontWeightOf(UIFont *font)
{
  // `fontAttributes` has only the attributes the descriptor was made with. `objectForKey:` resolves the traits.
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  NSNumber *trait = traits[UIFontWeightTrait];
  if (!trait) {
    return (font.fontDescriptor.symbolicTraits & UIFontDescriptorTraitBold) ? 700 : 400;
  }
  static const std::pair<CGFloat, int> weights[] = {
      {UIFontWeightUltraLight, 100}, {UIFontWeightThin, 200}, {UIFontWeightLight, 300}, {UIFontWeightRegular, 400},
      {UIFontWeightMedium, 500}, {UIFontWeightSemibold, 600}, {UIFontWeightBold, 700}, {UIFontWeightHeavy, 800},
      {UIFontWeightBlack, 900}};
  int best = 400;
  CGFloat bestDistance = 10;
  for (const auto &[weight, css] : weights) {
    if (std::fabs(weight - trait.doubleValue) < bestDistance) {
      bestDistance = std::fabs(weight - trait.doubleValue);
      best = css;
    }
  }
  return best;
}

/// Text props for one run of an attributed string, as the Text/Paragraph prop parser expects them.
folly::dynamic textPropsOf(UIFont *font, UIColor *color, NSParagraphStyle *paragraphStyle, NSNumber *kern, NSTextAlignment fallbackAlignment)
{
  folly::dynamic props = folly::dynamic::object;
  setColor(props, "color", color);
  if (font) {
    props["fontSize"] = (double)font.pointSize;
    props["fontWeight"] = std::to_string(fontWeightOf(font));
    if (font.fontDescriptor.symbolicTraits & UIFontDescriptorTraitItalic) {
      props["fontStyle"] = "italic";
    }
    if (![font.familyName hasPrefix:@"."]) {
      props["fontFamily"] = font.familyName.UTF8String;
    }
  }
  props["allowFontScaling"] = false;
  if (kern && kern.doubleValue != 0) {
    props["letterSpacing"] = kern.doubleValue;
  }
  NSTextAlignment alignment = paragraphStyle ? paragraphStyle.alignment : fallbackAlignment;
  switch (alignment) {
    case NSTextAlignmentCenter: props["textAlign"] = "center"; break;
    case NSTextAlignmentRight: props["textAlign"] = "right"; break;
    case NSTextAlignmentJustified: props["textAlign"] = "justify"; break;
    default: break;
  }
  if (paragraphStyle && paragraphStyle.minimumLineHeight > 0 && paragraphStyle.minimumLineHeight == paragraphStyle.maximumLineHeight) {
    props["lineHeight"] = (double)paragraphStyle.minimumLineHeight;
  }
  return props;
}

/// `Text` children (one per styled run) for a `Paragraph`.
folly::dynamic textRunsOf(NSAttributedString *text, NSTextAlignment fallbackAlignment)
{
  __block folly::dynamic runs = folly::dynamic::array;
  [text enumerateAttributesInRange:NSMakeRange(0, text.length)
                           options:0
                        usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange range, BOOL *) {
                          NSString *string = [text.string substringWithRange:range];
                          folly::dynamic rawText =
                              folly::dynamic::object("name", "RawText")("props", folly::dynamic::object("text", string.UTF8String))("children", folly::dynamic::array);
                          runs.push_back(folly::dynamic::object("name", "Text")(
                              "props",
                              textPropsOf(attributes[NSFontAttributeName], attributes[NSForegroundColorAttributeName],
                                          attributes[NSParagraphStyleAttributeName], attributes[NSKernAttributeName], fallbackAlignment))(
                              "children", folly::dynamic::array(std::move(rawText))));
                        }];
  return runs;
}

/// The visual part of a Fabric view's `ViewProps` (layout comes from the view's frame).
void serializeViewProps(const ViewProps &props, const LayoutMetrics &metrics, folly::dynamic &out)
{
  if (isColorMeaningful(props.backgroundColor)) {
    out["backgroundColor"] = colorToDynamic(props.backgroundColor);
  }
  auto border = props.resolveBorderMetrics(metrics);
  const auto &widths = metrics.borderWidth;
  if (widths.left > 0) out["borderLeftWidth"] = widths.left;
  if (widths.top > 0) out["borderTopWidth"] = widths.top;
  if (widths.right > 0) out["borderRightWidth"] = widths.right;
  if (widths.bottom > 0) out["borderBottomWidth"] = widths.bottom;
  if (isColorMeaningful(border.borderColors.left)) out["borderLeftColor"] = colorToDynamic(border.borderColors.left);
  if (isColorMeaningful(border.borderColors.top)) out["borderTopColor"] = colorToDynamic(border.borderColors.top);
  if (isColorMeaningful(border.borderColors.right)) out["borderRightColor"] = colorToDynamic(border.borderColors.right);
  if (isColorMeaningful(border.borderColors.bottom)) out["borderBottomColor"] = colorToDynamic(border.borderColors.bottom);
  if (border.borderRadii.topLeft.horizontal > 0) out["borderTopLeftRadius"] = border.borderRadii.topLeft.horizontal;
  if (border.borderRadii.topRight.horizontal > 0) out["borderTopRightRadius"] = border.borderRadii.topRight.horizontal;
  if (border.borderRadii.bottomLeft.horizontal > 0) out["borderBottomLeftRadius"] = border.borderRadii.bottomLeft.horizontal;
  if (border.borderRadii.bottomRight.horizontal > 0) out["borderBottomRightRadius"] = border.borderRadii.bottomRight.horizontal;
  if (props.shadowOpacity > 0 && isColorMeaningful(props.shadowColor)) {
    out["shadowColor"] = colorToDynamic(props.shadowColor);
    out["shadowOpacity"] = props.shadowOpacity;
    out["shadowRadius"] = props.shadowRadius;
    out["shadowOffset"] = folly::dynamic::object("width", props.shadowOffset.width)("height", props.shadowOffset.height);
  }
}

/// NULL when React Native renames or removes the ivar. The capture must not run then.
Ivar layoutMetricsIvar()
{
  static Ivar ivar = class_getInstanceVariable([RCTViewComponentView class], "_layoutMetrics");
  return ivar;
}

const LayoutMetrics &layoutMetricsOf(RCTViewComponentView *view)
{
  return *(const LayoutMetrics *)((const char *)(__bridge const void *)view + ivar_getOffset(layoutMetricsIvar()));
}

/**
 Serializes what is on screen, from the view hierarchy: only views that are attached and visible
 (the selected tab, the top screen of a stack), at the frames UIKit resolved (navigation bar insets,
 scroll offsets, safe areas included). Fabric views contribute their props; the paragraphs their
 attributed text as styled runs; UIKit's own views (navigation bars, tab bars, labels) contribute
 their background and text so native chrome is approximated too. Images and native controls that
 the prerender cannot draw become their frame only.
 */
/// Constraints inherited from UIKit chrome that composes its subviews in ways a static tree cannot.
struct Scope {
  CGRect clip = CGRectNull; // everything inside is confined to this rect
  CGRect exclude = CGRectNull; // labels inside this rect are drawn by another subtree
  CGRect lens = CGRectNull; // the selected item of an iOS 26 tab bar
};

UIView *findDescendant(UIView *view, NSString *classNameFragment, int depth = 0)
{
  if ([NSStringFromClass([view class]) containsString:classNameFragment]) {
    return view;
  }
  if (depth > 20) {
    return nil;
  }
  for (UIView *subview in view.subviews) {
    if (UIView *found = findDescendant(subview, classNameFragment, depth + 1)) {
      return found;
    }
  }
  return nil;
}

folly::dynamic serializeView(UIView *view, UIView *root, CGRect parentFrame, int depth, int &budget, bool debug, Scope scope)
{
  if (view.hidden || view.alpha <= 0.01 || depth > 80 || --budget < 0) {
    return nullptr;
  }
  CGRect frame = [view convertRect:view.bounds toView:root];
  bool clips = view.clipsToBounds;
  NSString *className = NSStringFromClass([view class]);
  if (!CGRectIsNull(scope.clip)) {
    frame = CGRectIntersection(frame, scope.clip);
    if (CGRectIsNull(frame) || CGRectIsEmpty(frame)) {
      return nullptr;
    }
  }
  if (!CGRectIsNull(scope.exclude) && [view isKindOfClass:[UILabel class]] && CGRectIntersectsRect(frame, scope.exclude)) {
    return nullptr;
  }
  // A mask shows only part of the view (tab bars reveal the selected item's label this way); the
  // closest static equivalent is clipping to the mask's bounding box.
  UIView *maskView = view.maskView;
  CALayer *maskLayer = view.layer.mask;
  if (maskView || maskLayer) {
    CGRect maskFrame = maskView ? [maskView convertRect:maskView.bounds toView:root]
                                : [view.layer convertRect:maskLayer.frame toLayer:root.layer];
    frame = CGRectIntersection(frame, maskFrame);
    if (CGRectIsNull(frame) || CGRectIsEmpty(frame)) {
      return nullptr;
    }
    clips = true;
  }
  bool onScreen = CGRectIntersectsRect(frame, root.bounds);
  if (!onScreen && (clips || view.subviews.count == 0)) {
    return nullptr;
  }

  std::string name = "View";
  folly::dynamic props = folly::dynamic::object;
  folly::dynamic children = folly::dynamic::array;
  if (debug) {
    props["_class"] = NSStringFromClass([view class]).UTF8String;
  }
  props["position"] = "absolute";
  props["left"] = (double)(frame.origin.x - parentFrame.origin.x);
  props["top"] = (double)(frame.origin.y - parentFrame.origin.y);
  props["width"] = (double)frame.size.width;
  props["height"] = (double)frame.size.height;
  if (view.alpha < 1) {
    props["opacity"] = (double)view.alpha;
  }
  if (clips) {
    props["overflow"] = "hidden";
  }

  // iOS 26 tab bar: a glass platter, a "lens" over the selected item, and two full sets of labels
  // (selected style shown through the lens, plain style elsewhere).
  if ([view isKindOfClass:[UITabBar class]]) {
    if (UIView *lens = findDescendant(view, @"LiquidLens")) {
      scope.lens = [lens convertRect:lens.bounds toView:root];
    }
  }
  if (!CGRectIsNull(scope.lens)) {
    if ([className containsString:@"LiquidLens"]) {
      // Drawn as the platter's first child, under the labels it magnifies.
      return nullptr;
    }
    if ([className containsString:@"PlatterView"]) {
      setColor(props, "backgroundColor", [UIColor.secondarySystemBackgroundColor resolvedColorWithTraitCollection:view.traitCollection]);
      props["borderRadius"] = (double)frame.size.height / 2;
      folly::dynamic lensProps = folly::dynamic::object("position", "absolute")(
          "left", (double)(scope.lens.origin.x - frame.origin.x))("top", (double)(scope.lens.origin.y - frame.origin.y))(
          "width", (double)scope.lens.size.width)("height", (double)scope.lens.size.height)(
          "borderRadius", (double)scope.lens.size.height / 2)("shadowColor", colorToDynamic(UIColor.blackColor))(
          "shadowOpacity", 0.08)("shadowRadius", 6.0)("shadowOffset", folly::dynamic::object("width", 0)("height", 2));
      setColor(lensProps, "backgroundColor", [UIColor.systemBackgroundColor resolvedColorWithTraitCollection:view.traitCollection]);
      children.push_back(folly::dynamic::object("name", "View")("props", std::move(lensProps))("children", folly::dynamic::array));
    } else if ([className containsString:@"SelectedContentView"]) {
      scope.clip = scope.lens;
    } else if ([className containsString:@"ContentView"]) {
      scope.exclude = scope.lens;
    }
  }

  if ([view isKindOfClass:[RCTViewComponentView class]]) {
    auto *componentView = (RCTViewComponentView *)view;
    const auto &metrics = layoutMetricsOf(componentView);
    if (const auto *viewProps = std::dynamic_pointer_cast<const ViewProps>([componentView props]).get()) {
      serializeViewProps(*viewProps, metrics, props);
    }
    if ([view isKindOfClass:[RCTParagraphComponentView class]]) {
      NSAttributedString *text = ((RCTParagraphComponentView *)view).attributedText;
      if (text.length == 0) {
        return nullptr;
      }
      name = "Paragraph";
      auto inner = metrics.contentInsets - metrics.borderWidth;
      if (inner.left > 0) props["paddingLeft"] = inner.left;
      if (inner.top > 0) props["paddingTop"] = inner.top;
      if (inner.right > 0) props["paddingRight"] = inner.right;
      if (inner.bottom > 0) props["paddingBottom"] = inner.bottom;
      if (const auto *paragraphProps = std::dynamic_pointer_cast<const ParagraphProps>([componentView props]).get()) {
        const auto &paragraph = paragraphProps->paragraphAttributes;
        if (paragraph.maximumNumberOfLines > 0) props["numberOfLines"] = paragraph.maximumNumberOfLines;
        props["ellipsizeMode"] = toString(paragraph.ellipsizeMode);
      }
      children = textRunsOf(text, NSTextAlignmentNatural);
      return folly::dynamic::object("name", name)("props", std::move(props))("children", std::move(children));
    }
  } else if ([view isKindOfClass:[UILabel class]]) {
    UILabel *label = (UILabel *)view;
    if (label.attributedText.length == 0) {
      return nullptr;
    }
    name = "Paragraph";
    if (label.numberOfLines > 0) props["numberOfLines"] = (int)label.numberOfLines;
    props["ellipsizeMode"] = "tail";
    NSMutableAttributedString *text = [label.attributedText mutableCopy];
    // UILabel applies its own font/color when the string carries none.
    [text enumerateAttributesInRange:NSMakeRange(0, text.length)
                             options:0
                          usingBlock:^(NSDictionary<NSAttributedStringKey, id> *attributes, NSRange range, BOOL *) {
                            if (!attributes[NSFontAttributeName] && label.font) [text addAttribute:NSFontAttributeName value:label.font range:range];
                            if (!attributes[NSForegroundColorAttributeName] && label.textColor) [text addAttribute:NSForegroundColorAttributeName value:label.textColor range:range];
                          }];
    children = textRunsOf(text, label.textAlignment);
    return folly::dynamic::object("name", name)("props", std::move(props))("children", std::move(children));
  } else if ([view isKindOfClass:[UIImageView class]]) {
    // Nothing to draw without an image loader; the frame stays blank.
    return nullptr;
  } else if ([view isKindOfClass:[UIVisualEffectView class]]) {
    // Bars blur the content below them; a flat system background is the closest the prerender gets.
    setColor(props, "backgroundColor", [UIColor.secondarySystemBackgroundColor resolvedColorWithTraitCollection:view.traitCollection]);
  } else {
    // A layer composited through a filter (glass, blend modes) does not show its plain color.
    bool filtered = view.layer.compositingFilter != nil || view.layer.filters.count > 0 || view.layer.backgroundFilters.count > 0;
    if (!filtered) {
      setColor(props, "backgroundColor", view.backgroundColor);
    }
    if (view.layer.cornerRadius > 0) props["borderRadius"] = (double)view.layer.cornerRadius;
    if (view.layer.borderWidth > 0 && view.layer.borderColor) {
      props["borderWidth"] = (double)view.layer.borderWidth;
      setColor(props, "borderColor", [UIColor colorWithCGColor:view.layer.borderColor]);
    }
  }

  for (UIView *subview in view.subviews) {
    auto child = serializeView(subview, root, frame, depth + 1, budget, debug, scope);
    if (!child.isNull()) {
      children.push_back(std::move(child));
    }
  }
  return folly::dynamic::object("name", name)("props", std::move(props))("children", std::move(children));
}

} // namespace

namespace expo {

folly::dynamic serializeSplashScreenSnapshot(UIView *rootView, int &budget, bool debug)
{
  if (!layoutMetricsIvar()) {
    return nullptr;
  }
  return serializeView(rootView, rootView, rootView.bounds, 0, budget, debug, Scope{});
}

} // namespace expo

#endif // !TARGET_OS_TV
