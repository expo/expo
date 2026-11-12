// Copyright 2015-present 650 Industries. All rights reserved.

#import "SplashScreenPrerender.h"

#import <CoreText/CoreText.h>
#import <objc/message.h>
#import <objc/runtime.h>

#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewRegistry.h>
#import <React/RCTMountingManager.h>
#import <React/RCTParagraphComponentView.h>
#import <React/RCTSafeAreaViewComponentView.h>
#import <React/RCTScheduler.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTSurfaceHostingProxyRootView.h>
#import <React/RCTSurfacePresenter.h>
#import <React/RCTSurfaceProtocol.h>
#import <React/RCTViewComponentView.h>
#import <React/RCTUtils.h>

#import <react/renderer/mounting/MountingOverrideDelegate.h>
#import <react/renderer/mounting/MountingTransaction.h>
#import <react/renderer/uimanager/UIManager.h>

#import <react/renderer/attributedstring/conversions.h>
#import <react/renderer/components/text/BaseTextProps.h>
#import <react/renderer/components/text/ParagraphProps.h>
#import <react/renderer/components/text/RawTextProps.h>
#import <react/renderer/components/view/ViewProps.h>

#import <react/renderer/componentregistry/ComponentDescriptorProvider.h>
#import <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>
#import <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#import <react/renderer/components/text/RawTextComponentDescriptor.h>
#import <react/renderer/components/text/TextComponentDescriptor.h>
#import <react/renderer/components/root/RootShadowNode.h>
#import <react/renderer/core/ComponentDescriptor.h>
#import <react/renderer/core/LayoutConstraints.h>
#import <react/renderer/core/LayoutContext.h>
#import <react/renderer/core/PropsParserContext.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/core/ShadowNodeFamily.h>
#import <react/renderer/core/ShadowNodeFragment.h>
#import <react/renderer/mounting/MountingCoordinator.h>
#import <react/renderer/mounting/ShadowTree.h>
#import <react/renderer/mounting/ShadowTreeDelegate.h>
#import <react/utils/ContextContainer.h>
#import <react/utils/FollyConvert.h>

#import <folly/dynamic.h>

#import <cstring>
#import <unordered_map>
#import <unordered_set>

using namespace facebook::react;

#import <sys/sysctl.h>
#import <unistd.h>

namespace {

NSString *const kTemplateResourceName = @"SplashScreenPrerender";

/// Wall-clock process start time in seconds since the Unix epoch, from the kernel.
double processStartTime()
{
  struct kinfo_proc info;
  size_t size = sizeof(info);
  int mib[4] = {CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()};
  if (sysctl(mib, 4, &info, &size, NULL, 0) != 0) {
    return [[NSDate date] timeIntervalSince1970];
  }
  return (double)info.kp_proc.p_un.__p_starttime.tv_sec + (double)info.kp_proc.p_un.__p_starttime.tv_usec / 1e6;
}
// Root tags end in 1; this one is far above anything React allocates.
const SurfaceId kSurfaceId = 900001;

/**
 Builds shadow nodes from a template node `{ "name": "View", "props": {...}, "children": [...] }`.
 Component names are Fabric names (`View`, `Paragraph`, `RawText`, `Image`, ...).
 */
class TemplateBuilder {
 public:
  TemplateBuilder(const ComponentDescriptorRegistry &registry, const ContextContainer &contextContainer)
      : registry_(registry), contextContainer_(contextContainer)
  {
  }

  std::shared_ptr<const ShadowNode> build(const folly::dynamic &node)
  {
    const auto &descriptor = registry_.at(node["name"].asString());
    auto family = descriptor.createFamily(ShadowNodeFamilyFragment{allocateTag(), kSurfaceId, nullptr});

    PropsParserContext parserContext{kSurfaceId, contextContainer_};
    folly::dynamic rawProps = node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    auto props = descriptor.cloneProps(parserContext, nullptr, RawProps(std::move(rawProps)));

    auto mutableChildren = std::vector<std::shared_ptr<const ShadowNode>>{};
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto &child : node["children"]) {
        mutableChildren.push_back(build(child));
      }
    }
    std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>> children =
        std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(std::move(mutableChildren));

    auto state = descriptor.createInitialState(props, family);
    return descriptor.createShadowNode(
        ShadowNodeFragment{
            .props = props,
            .children = children,
            .state = state,
            .runtimeShadowNodeReference = false,
        },
        family);
  }

 private:
  // Odd tags not ending in 1 never collide with React's even tags or with root tags.
  Tag allocateTag()
  {
    Tag tag = nextTag_;
    nextTag_ += 2;
    if (nextTag_ % 10 == 1) {
      nextTag_ += 2;
    }
    return tag;
  }

  const ComponentDescriptorRegistry &registry_;
  const ContextContainer &contextContainer_;
  Tag nextTag_ = 1000003;
};

/**
 The only thing the UIManager/Scheduler pair contributes to a native commit is handing the
 finished transaction to the mounting manager, so this delegate does just that.
 */
class MountingTreeDelegate : public ShadowTreeDelegate {
 public:
  explicit MountingTreeDelegate(RCTMountingManager *mountingManager) : mountingManager_(mountingManager) {}

  RootShadowNode::Unshared shadowTreeWillCommit(
      const ShadowTree &,
      const RootShadowNode::Shared &,
      const RootShadowNode::Unshared &newRootShadowNode,
      const ShadowTreeCommitOptions &) const override
  {
    return newRootShadowNode;
  }

  void shadowTreeDidFinishTransaction(std::shared_ptr<const MountingCoordinator> mountingCoordinator, bool) const override
  {
    [mountingManager_ scheduleTransaction:std::move(mountingCoordinator)];
  }

  void shadowTreeDidFinishReactCommit(const ShadowTree &) const override {}
  void shadowTreeDidPromoteReactRevision(const ShadowTree &) const override {}

 private:
  RCTMountingManager *mountingManager_;
};

/**
 Hydration at the mounting layer. After the snapshot is committed into the app's surface, React
 builds its tree over several commits. Instead of letting those commits delete the prerendered views,
 the deletes are held back; when React later creates a node with the same tag and component, the
 `Create` becomes an `Update` of the prerendered view (adoption). Whatever React never claims is
 removed directly from the view hierarchy once the app has hidden the splash screen and React has
 settled; replaying the held mutations later would confuse other mounting delegates that mirror the
 stream (Reanimated's layout animations). Mutations otherwise pass through untouched. Runs on the
 mounting thread (main).
 */
class TransactionWatcher : public MountingOverrideDelegate {
 public:
  struct Stats {
    int number{}, create{}, insert{}, update{}, remove{}, del{}, adopted{}, held{};
    bool isHydrationCommit{};
  };

  TransactionWatcher(std::unordered_set<Tag> prerendered, std::function<void(Stats)> onTransaction)
      : prerendered_(std::move(prerendered)), onTransaction_(std::move(onTransaction))
  {
  }

  bool isActive() const { return active_; }
  std::vector<Tag> heldTags() const
  {
    std::vector<Tag> tags;
    for (const auto &entry : heldDeletes_) tags.push_back(entry.first);
    return tags;
  }
  void deactivate() { active_ = false; heldDeletes_.clear(); heldRemoves_.clear(); }

  bool shouldOverridePullTransaction() const override { return true; }

  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const override
  {
    Stats stats;
    stats.number = (int)number;
    // The first transaction this watcher sees is the hydration commit itself.
    stats.isHydrationCommit = !sawFirst_;
    sawFirst_ = true;
    ShadowViewMutationList out;
    out.reserve(mutations.size());
    for (auto &mutation : mutations) {
      if (active_) {
        Tag tag = mutation.type == ShadowViewMutation::Create || mutation.type == ShadowViewMutation::Insert || mutation.type == ShadowViewMutation::Update
            ? mutation.newChildShadowView.tag
            : mutation.oldChildShadowView.tag;
        if (mutation.type == ShadowViewMutation::Remove && isHeldCandidate(tag)) {
          heldRemoves_.insert_or_assign(tag, mutation);
          continue;
        }
        if (mutation.type == ShadowViewMutation::Delete && isHeldCandidate(tag)) {
          heldDeletes_.insert_or_assign(tag, mutation);
          continue;
        }
        if (mutation.type == ShadowViewMutation::Create) {
          auto held = heldDeletes_.find(tag);
          if (held != heldDeletes_.end()) {
            const ShadowView &old = held->second.oldChildShadowView;
            auto removed = heldRemoves_.find(tag);
            if (std::strcmp(old.componentName, mutation.newChildShadowView.componentName) == 0) {
              out.push_back(ShadowViewMutation::UpdateMutation(
                  old, mutation.newChildShadowView, removed != heldRemoves_.end() ? removed->second.parentTag : -1));
              adopted_.insert(tag);
              heldDeletes_.erase(held);
              if (removed != heldRemoves_.end()) heldRemoves_.erase(removed);
              stats.adopted++;
              continue;
            }
            // Same tag, different component: the prerendered view goes first.
            if (removed != heldRemoves_.end()) {
              out.push_back(removed->second);
              heldRemoves_.erase(removed);
            }
            out.push_back(held->second);
            heldDeletes_.erase(held);
          }
        }
      }
      out.push_back(mutation);
    }
    for (const auto &mutation : out) {
      switch (mutation.type) {
        case ShadowViewMutation::Create: stats.create++; break;
        case ShadowViewMutation::Insert: stats.insert++; break;
        case ShadowViewMutation::Update: stats.update++; break;
        case ShadowViewMutation::Remove: stats.remove++; break;
        case ShadowViewMutation::Delete: stats.del++; break;
        default: break;
      }
    }
    stats.held = (int)heldDeletes_.size();
    onTransaction_(stats);
    return MountingTransaction{surfaceId, number, std::move(out), telemetry};
  }

 private:
  bool isHeldCandidate(Tag tag) const { return prerendered_.count(tag) != 0 && adopted_.count(tag) == 0; }

  std::unordered_set<Tag> prerendered_;
  std::function<void(Stats)> onTransaction_;
  mutable bool active_ = true;
  mutable bool sawFirst_ = false;
  mutable std::unordered_set<Tag> adopted_;
  mutable std::unordered_map<Tag, ShadowViewMutation> heldDeletes_;
  mutable std::unordered_map<Tag, ShadowViewMutation> heldRemoves_;
};

/**
 Builds the snapshot into the app's own surface through its UIManager, the way JS does
 (`createNode` / `appendChild`), with the components and tags React used when the snapshot was taken.
 The snapshot is a view hierarchy: UIKit views between two Fabric views (a navigation controller's
 containers, a scroll view's content view) belong to the native components, not to React, so a node's
 React children are the tagged descendants reachable without crossing another tagged node. Text runs
 under a paragraph are kept. Views without a React tag (UIKit chrome) are left to the overlay.
 */
class HydrationBuilder {
 public:
  HydrationBuilder(const UIManager &uiManager, SurfaceId surfaceId) : uiManager_(uiManager), surfaceId_(surfaceId) {}

  /**
   Native containers that drive UIKit controllers (react-native-screens stacks, tabs, headers) cannot
   be instantiated from a props subset without React: UIKit asserts on their half-configured state.
   They are drawn as plain views with fresh tags; React creates the real ones and the prerendered
   children (which keep their tags) are adopted into them.
   */
  static bool isNativeController(const std::string &component)
  {
    return component.rfind("RNS", 0) == 0;
  }

  /**
   Nodes created here have event targets with no React instance behind them, and the first event a
   native view emits on its own (`onInsetsChange` from a safe-area provider, scroll and layout
   events) would crash in `UIManagerBinding::dispatchEvent`. Only components that never emit events
   without a prop asking for it keep React's tag and component; the rest are plain views with fresh
   tags, and React creates the real ones (their prerendered children still get adopted).
   */
  static bool emitsNoEventsOnItsOwn(const std::string &component)
  {
    return component == "View" || component == "Paragraph" || component.find("SplashScreenExcludeView") != std::string::npos;
  }

  std::shared_ptr<const ShadowNode> buildTagged(const folly::dynamic &node)
  {
    Tag tag = (Tag)node["tag"].asInt();
    std::string component = node.count("component") != 0 && node["component"].isString() ? node["component"].asString() : node["name"].asString();
    folly::dynamic props = node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    std::shared_ptr<ShadowNode> shadowNode;
    if (!isNativeController(component) && emitsNoEventsOnItsOwn(component)) {
      try {
        shadowNode = uiManager_.createNode(tag, component, surfaceId_, RawProps(props), nullptr);
        reused_++;
      } catch (const std::exception &) {
        shadowNode = nullptr;
      }
    }
    if (!shadowNode) {
      tag = allocateTag();
      shadowNode = uiManager_.createNode(tag, node["name"].asString(), surfaceId_, RawProps(props), nullptr);
    }
    prerendered_.insert(tag);
    created_++;
    std::vector<std::shared_ptr<const ShadowNode>> children;
    collectChildren(node, children);
    for (const auto &child : children) {
      uiManager_.appendChild(shadowNode, child);
    }
    return shadowNode;
  }

  /// Root children: the tagged nodes right below React's root view.
  void buildRootChildren(const folly::dynamic &rootNode, std::vector<std::shared_ptr<const ShadowNode>> &out) { collectChildren(rootNode, out); }

  const std::unordered_set<Tag> &prerenderedTags() const { return prerendered_; }
  int created() const { return created_; }
  int reused() const { return reused_; }

 private:
  void collectChildren(const folly::dynamic &node, std::vector<std::shared_ptr<const ShadowNode>> &out)
  {
    if (node.count("children") == 0 || !node["children"].isArray()) {
      return;
    }
    for (const auto &child : node["children"]) {
      const std::string name = child["name"].asString();
      if (child.count("tag") != 0 && child["tag"].isInt()) {
        out.push_back(buildTagged(child));
      } else if (name == "Text" || name == "RawText") {
        out.push_back(buildText(child));
      } else if (name == "Paragraph") {
        // A UIKit label (navigation title, tab label): not React's, the overlay draws it.
      } else {
        collectChildren(child, out); // a UIKit view: hoist whatever React owns below it
      }
    }
  }

  std::shared_ptr<const ShadowNode> buildText(const folly::dynamic &node)
  {
    Tag tag = allocateTag();
    folly::dynamic props = node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
    auto shadowNode = uiManager_.createNode(tag, node["name"].asString(), surfaceId_, RawProps(props), nullptr);
    prerendered_.insert(tag);
    created_++;
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto &child : node["children"]) {
        uiManager_.appendChild(shadowNode, buildText(child));
      }
    }
    return shadowNode;
  }

  // Odd tags: React allocates even ones, roots end in 1.
  Tag allocateTag()
  {
    Tag tag = nextTag_;
    nextTag_ += 2;
    if (nextTag_ % 10 == 1) {
      nextTag_ += 2;
    }
    return tag;
  }

  const UIManager &uiManager_;
  SurfaceId surfaceId_;
  std::unordered_set<Tag> prerendered_;
  Tag nextTag_ = 1000003;
  int created_ = 0;
  int reused_ = 0;
};

#pragma mark - Snapshot of the screen

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
  NSNumber *trait = font.fontDescriptor.fontAttributes[UIFontDescriptorTraitsAttribute][UIFontWeightTrait];
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

const LayoutMetrics &layoutMetricsOf(RCTViewComponentView *view)
{
  static Ivar ivar = class_getInstanceVariable([RCTViewComponentView class], "_layoutMetrics");
  return *(const LayoutMetrics *)((const char *)(__bridge const void *)view + ivar_getOffset(ivar));
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

  // `SplashScreen.Exclude`: the box stays, its content is never serialized.
  if ([view conformsToProtocol:@protocol(SplashScreenSnapshotExcluded)]) {
    setColor(props, "backgroundColor", ((id<SplashScreenSnapshotExcluded>)view).placeholderColor);
    return folly::dynamic::object("name", name)("props", std::move(props))("children", std::move(children));
  }

  if ([view isKindOfClass:[RCTViewComponentView class]]) {
    auto *componentView = (RCTViewComponentView *)view;
    const auto &metrics = layoutMetricsOf(componentView);
    // React's tag and component name, for the next launch to hand these views back to React.
    props["_tag"] = (int64_t)view.tag;
    props["_component"] = [[view class] componentDescriptorProvider].name;
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

@implementation SplashScreenPrerender {
  dispatch_group_t _prepared;
  CGRect _bounds;
  std::shared_ptr<const ContextContainer> _contextContainer;
  std::shared_ptr<ComponentDescriptorProviderRegistry> _providerRegistry;
  std::shared_ptr<const ComponentDescriptorRegistry> _registry;
  RCTMountingManager *_mountingManager;
  std::unique_ptr<MountingTreeDelegate> _treeDelegate;
  std::unique_ptr<ShadowTree> _tree;
  RootShadowNode::Unshared _preparedRoot;
  UIView *_containerView;
  UIWindow *_window;
  NSTimeInterval _processStart;
  NSString *_templateSource;
  NSDictionary<NSString *, NSString *> *_snapshotFonts;
  NSInteger _snapshotRootTag;
  folly::dynamic _snapshotTemplate;
  std::shared_ptr<TransactionWatcher> _transactionWatcher;
  BOOL _hydrated;
  BOOL _awaitingReactTransaction;
  BOOL _reactCommitted;
  BOOL _flushPending;
  BOOL _dismissPending;
  NSTimeInterval _pendingDismissFade;
  int _adoptedTotal;
  NSTimeInterval _lastTransactionTime;
  NSTimeInterval _pendingCaptureDelay;
  __weak UIView *_appRootView;
}

+ (instancetype)shared
{
  static SplashScreenPrerender *instance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [SplashScreenPrerender new];
  });
  return instance;
}

+ (void)load
{
  SplashScreenPrerender *prerender = [self shared];
  if (prerender.isEnabled) {
    [prerender log:@"+load"];
    [prerender prepare];
  }
}

- (instancetype)init
{
  if (self = [super init]) {
    // `-ExpoSplashScreenPrerenderDisabled 1` as a launch argument turns the prerender off for A/B runs.
    BOOL disabled = [[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderDisabled"];
    // Both come from the config plugin's `prerender` option: a bundled template and/or the
    // `ExpoSplashScreenPrerenderSnapshot` Info.plist flag.
    BOOL hasBundledTemplate = [[NSBundle mainBundle] URLForResource:kTemplateResourceName withExtension:@"json"] != nil;
    _isSnapshotEnabled = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ExpoSplashScreenPrerenderSnapshot"] boolValue];
    _isEnabled = !disabled && (hasBundledTemplate || _isSnapshotEnabled) && !RCTRunningInAppExtension();
    _processStart = [[NSProcessInfo processInfo] systemUptime] - ([[NSDate date] timeIntervalSince1970] - processStartTime());
  }
  return self;
}

- (void)log:(NSString *)stage
{
  if (![[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"]) {
    return;
  }
  NSLog(@"[expo-splash-screen] prerender %@ at %.1f ms since process start", stage,
        ([[NSProcessInfo processInfo] systemUptime] - _processStart) * 1000.0);
}

#pragma mark - Preparation (background)

/**
 React Native's feature flags can be overridden once and must not be read before that.
 `RCTReactNativeFactory` overrides them in its init, inside `didFinishLaunching`, and the renderer
 reads them everywhere. Running the factory's one-time setup here, with the release level it would
 use, lets the renderer run before the factory exists; the factory's later call is then a no-op.
 */
- (BOOL)setUpFeatureFlagsEarly
{
  Class factoryClass = NSClassFromString(@"RCTReactNativeFactory");
  SEL selector = NSSelectorFromString(@"_setUpFeatureFlags:");
  if (!factoryClass || ![factoryClass instancesRespondToSelector:selector]) {
    return NO;
  }
  NSString *level = [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ReactNativeReleaseLevel"] lowercaseString];
  NSInteger releaseLevel = [level isEqualToString:@"canary"] ? 0 : [level isEqualToString:@"experimental"] ? 1 : 2;
  ((void (*)(id, SEL, NSInteger))objc_msgSend)([factoryClass alloc], selector, releaseLevel);
  return YES;
}

- (void)prepare
{
  if (_prepared || ![self setUpFeatureFlagsEarly]) {
    return;
  }
  _prepared = dispatch_group_create();
  dispatch_group_enter(_prepared);
  _bounds = UIScreen.mainScreen.bounds;
  CGFloat scale = UIScreen.mainScreen.scale;
  CGRect bounds = _bounds;
  LayoutDirection layoutDirection =
      [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:UISemanticContentAttributeUnspecified] ==
          UIUserInterfaceLayoutDirectionRightToLeft
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;

  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INTERACTIVE, 0), ^{
    [self prepareWithBounds:bounds scale:scale layoutDirection:layoutDirection];
    dispatch_group_leave(self->_prepared);
  });
}

- (void)prepareWithBounds:(CGRect)bounds scale:(CGFloat)scale layoutDirection:(LayoutDirection)layoutDirection
{
  NSDictionary *json = [self loadTemplate];
  if (!json) {
    // Snapshot-only configuration before the first capture, or an invalid template.
    [self log:@"no template for this launch"];
    return;
  }
  folly::dynamic templateDynamic = convertIdToFollyDynamic(json);
  [self registerFontsUsedByTemplate:templateDynamic];

  auto contextContainer = std::make_shared<ContextContainer>();
  _contextContainer = contextContainer;
  // A private descriptor registry with the core components only (no Image yet: its descriptor needs
  // an RCTImageLoader in the context container). Asking the component view factory
  // for one would tie it to every component registered later (and build their descriptors against
  // this context container, which has no bridge); the view classes themselves still come from the
  // factory when the mounting manager creates views.
  RCTMountingManager *mountingManager = [RCTMountingManager new];
  mountingManager.contextContainer = contextContainer;
  _mountingManager = mountingManager;
  _treeDelegate = std::make_unique<MountingTreeDelegate>(mountingManager);

  LayoutConstraints layoutConstraints{
      .minimumSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height},
      .maximumSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height},
      .layoutDirection = layoutDirection};
  LayoutContext layoutContext{};
  layoutContext.pointScaleFactor = (Float)scale;
  layoutContext.viewportSize = {.width = (Float)bounds.size.width, .height = (Float)bounds.size.height};
  _tree = std::make_unique<ShadowTree>(kSurfaceId, layoutConstraints, layoutContext, *_treeDelegate, *contextContainer);

  try {
    // Providers for view-producing components come from the component view classes, so their
    // component handles are the ones the view factory registered (React Native may be a prebuilt
    // framework; a template instantiated here would get a different handle). RawText and Text
    // produce no views, so local instantiations are fine.
    // The factory registers view classes lazily, when React asks for a component by name; the
    // mounting manager can only create views for classes it has registered.
    RCTComponentViewFactory *viewFactory = [RCTComponentViewFactory currentComponentViewFactory];
    [viewFactory registerComponentViewClass:[RCTViewComponentView class]];
    [viewFactory registerComponentViewClass:[RCTScrollViewComponentView class]];
    [viewFactory registerComponentViewClass:[RCTSafeAreaViewComponentView class]];

    auto providerRegistry = std::make_shared<ComponentDescriptorProviderRegistry>();
    providerRegistry->add([RCTViewComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTParagraphComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTScrollViewComponentView componentDescriptorProvider]);
    providerRegistry->add([RCTSafeAreaViewComponentView componentDescriptorProvider]);
    providerRegistry->add(concreteComponentDescriptorProvider<TextComponentDescriptor>());
    providerRegistry->add(concreteComponentDescriptorProvider<RawTextComponentDescriptor>());
    _providerRegistry = providerRegistry;
    _registry = providerRegistry->createComponentDescriptorRegistry(ComponentDescriptorParameters{
        .eventDispatcher = EventDispatcher::Shared{}, .contextContainer = contextContainer, .flavor = nullptr});
    TemplateBuilder builder(*_registry, *contextContainer);
    auto child = builder.build(templateDynamic);
    auto children = std::make_shared<const std::vector<std::shared_ptr<const ShadowNode>>>(
        std::vector<std::shared_ptr<const ShadowNode>>{child});
    const auto &currentRoot = *_tree->getCurrentRevision().rootShadowNode;
    auto newRoot = std::static_pointer_cast<RootShadowNode>(currentRoot.ShadowNode::clone(ShadowNodeFragment{.children = children}));
    std::vector<const LayoutableShadowNode *> affected;
    newRoot->layoutIfNeeded(&affected);
    _preparedRoot = newRoot;
    [self log:[NSString stringWithFormat:@"prepared (background, template from %@)", _templateSource]];
  } catch (const std::exception &e) {
    NSLog(@"[expo-splash-screen] prerender: failed to build template: %s", e.what());
  }
}

#pragma mark - Template source

/// Where the snapshot of the last launch's first screen lives: `Application Support/expo-splash-screen`.
- (NSURL *)snapshotURL
{
  NSURL *support = [[NSFileManager defaultManager] URLForDirectory:NSApplicationSupportDirectory
                                                          inDomain:NSUserDomainMask
                                                 appropriateForURL:nil
                                                            create:NO
                                                             error:nil];
  return [[support URLByAppendingPathComponent:@"expo-splash-screen" isDirectory:YES]
      URLByAppendingPathComponent:@"launch-snapshot.json"];
}

/**
 What a snapshot was taken under. A snapshot replays only when all of it still matches: frames are
 absolute, so a different window, text size or appearance would draw the wrong screen.
 */
- (NSDictionary *)environmentKeyForTraits:(UITraitCollection *)traits bounds:(CGRect)bounds scale:(CGFloat)scale
{
  NSDictionary *info = [[NSBundle mainBundle] infoDictionary];
  return @{
    @"width" : @(bounds.size.width),
    @"height" : @(bounds.size.height),
    @"scale" : @(scale),
    @"appearance" : @(traits.userInterfaceStyle),
    @"contentSize" : traits.preferredContentSizeCategory ?: @"",
    @"build" : [NSString stringWithFormat:@"%@ %@", info[@"CFBundleShortVersionString"], info[@"CFBundleVersion"]],
  };
}

- (nullable NSDictionary *)loadTemplate
{
  NSData *snapshotData = _isSnapshotEnabled ? [NSData dataWithContentsOfURL:[self snapshotURL]] : nil;
  if (snapshotData) {
    id snapshot = [NSJSONSerialization JSONObjectWithData:snapshotData options:0 error:nil];
    NSDictionary *expected = [self environmentKeyForTraits:UIScreen.mainScreen.traitCollection
                                                    bounds:UIScreen.mainScreen.bounds
                                                     scale:UIScreen.mainScreen.scale];
    if ([snapshot isKindOfClass:[NSDictionary class]] && [snapshot[@"environment"] isEqualToDictionary:expected] &&
        [snapshot[@"template"] isKindOfClass:[NSDictionary class]]) {
      _templateSource = @"snapshot";
      _snapshotFonts = [snapshot[@"fonts"] isKindOfClass:[NSDictionary class]] ? snapshot[@"fonts"] : nil;
      _snapshotRootTag = [snapshot[@"rootTag"] respondsToSelector:@selector(integerValue)] ? [snapshot[@"rootTag"] integerValue] : 0;
      _snapshotTemplate = convertIdToFollyDynamic(snapshot[@"template"]);
      return snapshot[@"template"];
    }
    [self log:@"snapshot does not match this environment, using the bundled template"];
  }
  NSURL *url = [[NSBundle mainBundle] URLForResource:kTemplateResourceName withExtension:@"json"];
  NSData *data = url ? [NSData dataWithContentsOfURL:url] : nil;
  id json = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  _templateSource = @"bundle";
  return [json isKindOfClass:[NSDictionary class]] ? json : nil;
}

#pragma mark - Snapshot

- (void)setAppRootView:(nullable UIView *)rootView
{
  _appRootView = rootView;
}

- (void)captureLaunchScreenAfterDelay:(NSTimeInterval)delay
{
  if (_hydrated && !_reactCommitted) {
    // The screen on display is still the prerender; capture once React has taken over.
    _pendingCaptureDelay = MAX(delay, 0.5);
    return;
  }
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self saveLaunchScreen];
  });
}

- (BOOL)saveLaunchScreen
{
  RCTAssertMainQueue();
  UIView *rootView = _appRootView;
  if (!_isEnabled || !_isSnapshotEnabled || !rootView || !rootView.window) {
    return NO;
  }
  int budget = 5000;
  bool debug = [[NSUserDefaults standardUserDefaults] boolForKey:@"ExpoSplashScreenPrerenderLog"];
  folly::dynamic templateDynamic = serializeView(rootView, rootView, rootView.bounds, 0, budget, debug, Scope{});
  if (templateDynamic.isNull() || templateDynamic["children"].empty()) {
    [self log:@"snapshot: nothing on screen"];
    return NO;
  }
  templateDynamic["props"].erase("position");
  templateDynamic["props"].erase("left");
  templateDynamic["props"].erase("top");
  // `_tag` / `_component` were collected as props for convenience; they are node fields.
  std::function<void(folly::dynamic &)> hoist = [&](folly::dynamic &n) {
    auto &p = n["props"];
    if (p.count("_tag") != 0) {
      n["tag"] = p["_tag"];
      n["component"] = p["_component"];
      p.erase("_tag");
      p.erase("_component");
    }
    for (auto &child : n["children"]) {
      hoist(child);
    }
  };
  hoist(templateDynamic);
  NSInteger rootTag = [rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]]
      ? ((RCTSurfaceHostingProxyRootView *)rootView).surface.rootTag
      : 0;
  NSDictionary *environment = [self environmentKeyForTraits:rootView.traitCollection
                                                     bounds:UIScreen.mainScreen.bounds
                                                      scale:UIScreen.mainScreen.scale];
  NSURL *url = [self snapshotURL];
  NSDictionary *fonts = [[self class] fontFilesForFamilies:[[self class] fontFamiliesUsedByTemplate:templateDynamic]];
  NSDictionary *snapshot = @{
    @"environment" : environment,
    @"fonts" : fonts,
    @"rootTag" : @(rootTag),
    @"template" : convertFollyDynamicToId(templateDynamic)
  };
  [self log:[NSString stringWithFormat:@"snapshot serialized (%d views)", 5000 - budget]];
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_UTILITY, 0), ^{
    NSData *data = [NSJSONSerialization dataWithJSONObject:snapshot options:0 error:nil];
    [[NSFileManager defaultManager] createDirectoryAtURL:url.URLByDeletingLastPathComponent
                             withIntermediateDirectories:YES
                                              attributes:nil
                                                   error:nil];
    BOOL written = [data writeToURL:url options:NSDataWritingAtomic | NSDataWritingFileProtectionComplete error:nil];
    [self log:[NSString stringWithFormat:@"snapshot %@ (%lu bytes)", written ? @"saved" : @"not saved", (unsigned long)data.length]];
  });
  return YES;
}

- (void)clearLaunchScreen
{
  [[NSFileManager defaultManager] removeItemAtURL:[self snapshotURL] error:nil];
}

#pragma mark - Fonts

/**
 Custom fonts (icon fonts, brand fonts) are registered by `expo-font` once JS runs. A template that
 uses one names its family; the matching font file in the app bundle is registered here first.
 */
+ (NSSet<NSString *> *)fontFamiliesUsedByTemplate:(const folly::dynamic &)node
{
  NSMutableSet<NSString *> *families = [NSMutableSet set];
  std::function<void(const folly::dynamic &)> collect = [&](const folly::dynamic &n) {
    if (n.isObject()) {
      if (n.count("props") && n["props"].isObject() && n["props"].count("fontFamily") && n["props"]["fontFamily"].isString()) {
        [families addObject:@(n["props"]["fontFamily"].c_str())];
      }
      if (n.count("children") && n["children"].isArray()) {
        for (const auto &child : n["children"]) {
          collect(child);
        }
      }
    }
  };
  collect(node);
  return families;
}

/// Font files (relative to the app bundle) for the families a snapshot uses, as CoreText knows them
/// once `expo-font` has registered them.
+ (NSDictionary<NSString *, NSString *> *)fontFilesForFamilies:(NSSet<NSString *> *)families
{
  NSMutableDictionary *files = [NSMutableDictionary dictionary];
  NSString *bundlePath = [NSBundle mainBundle].bundlePath;
  for (NSString *family in families) {
    CTFontDescriptorRef descriptor = CTFontDescriptorCreateWithAttributes(
        (__bridge CFDictionaryRef) @{(__bridge NSString *)kCTFontFamilyNameAttribute : family});
    CTFontDescriptorRef match = CTFontDescriptorCreateMatchingFontDescriptor(descriptor, NULL);
    CFRelease(descriptor);
    if (!match) {
      continue;
    }
    NSURL *url = CFBridgingRelease(CTFontDescriptorCopyAttribute(match, kCTFontURLAttribute));
    CFRelease(match);
    NSString *path = url.path;
    if ([path hasPrefix:bundlePath]) {
      files[family] = [path substringFromIndex:bundlePath.length];
    }
  }
  return files;
}

- (void)registerFontsUsedByTemplate:(const folly::dynamic &)node
{
  NSSet<NSString *> *families = [[self class] fontFamiliesUsedByTemplate:node];
  for (NSString *family in families) {
    if ([UIFont fontNamesForFamilyName:family].count > 0) {
      continue;
    }
    NSString *knownFile = _snapshotFonts[family];
    if (knownFile) {
      NSURL *url = [NSURL fileURLWithPath:[[NSBundle mainBundle].bundlePath stringByAppendingString:knownFile]];
      bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, NULL);
      [self log:[NSString stringWithFormat:@"font %@ %@ from %@", family, registered ? @"registered" : @"not registered", knownFile]];
      if (registered) {
        continue;
      }
    }
    NSDirectoryEnumerator *files = [[NSFileManager defaultManager] enumeratorAtURL:[NSBundle mainBundle].bundleURL
                                                        includingPropertiesForKeys:nil
                                                                           options:NSDirectoryEnumerationSkipsHiddenFiles
                                                                      errorHandler:nil];
    for (NSURL *url in files) {
      NSString *extension = url.pathExtension.lowercaseString;
      if (([extension isEqualToString:@"ttf"] || [extension isEqualToString:@"otf"]) &&
          [url.lastPathComponent.stringByDeletingPathExtension caseInsensitiveCompare:family] == NSOrderedSame) {
        CFErrorRef error = NULL;
        bool registered = CTFontManagerRegisterFontsForURL((__bridge CFURLRef)url, kCTFontManagerScopeProcess, &error);
        [self log:[NSString stringWithFormat:@"font %@ %@", family, registered ? @"registered" : @"not registered"]];
        if (error) CFRelease(error);
        break;
      }
    }
  }
}

#pragma mark - Hydration (snapshot committed into the app's surface)

/// Experimental, off by default: `ExpoSplashScreenPrerenderHydrate` in Info.plist or as a launch argument.
- (BOOL)isHydrationEnabled
{
  id launchArgument = [[NSUserDefaults standardUserDefaults] objectForKey:@"ExpoSplashScreenPrerenderHydrate"];
  if (launchArgument != nil) {
    return [launchArgument boolValue];
  }
  return [[[NSBundle mainBundle] objectForInfoDictionaryKey:@"ExpoSplashScreenPrerenderHydrate"] boolValue];
}

/**
 Main thread. Once the app's surface has a shadow tree (its scheduler exists, before the bundle has
 run), commits the snapshot into it with the recorded tags and mounts synchronously. React's first
 commit then updates these views in place. Polls briefly because the surface starts asynchronously.
 */
- (void)hydrateAppSurfaceWhenReady
{
  RCTAssertMainQueue();
  if (!_isSnapshotEnabled || ![self isHydrationEnabled] || _snapshotRootTag == 0 || _snapshotTemplate.isNull()) {
    return;
  }
  NSTimeInterval deadline = [[NSProcessInfo processInfo] systemUptime] + 3.0;
  [self log:@"hydration: waiting for the app surface"];
  [self tryHydrateUntil:deadline];
}

- (void)tryHydrateUntil:(NSTimeInterval)deadline
{
  UIView *rootView = _appRootView;
  if (_hydrated || !rootView || ![rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]]) {
    return;
  }
  id<RCTSurfaceProtocol> surface = ((RCTSurfaceHostingProxyRootView *)rootView).surface;
  RCTSurfacePresenter *presenter = [(NSObject *)surface valueForKey:@"surfacePresenter"];
  std::shared_ptr<UIManager> uiManager = presenter.scheduler.uiManager;
  SurfaceId surfaceId = (SurfaceId)surface.rootTag;
  bool found = false;
  bool empty = false;
  std::shared_ptr<const MountingCoordinator> coordinator;
  if (uiManager) {
    uiManager->getShadowTreeRegistry().visit(surfaceId, [&](const ShadowTree &tree) {
      found = true;
      empty = tree.getCurrentRevision().rootShadowNode->getChildren().empty();
      coordinator = tree.getMountingCoordinator();
    });
  }
  if (!found) {
    // The host starts the surface only after the bundle has loaded; its shadow tree appears on the
    // JS thread right before React's first render, so this polls fast and commits in that window.
    // (Starting the surface earlier ourselves runs `startSurface` in JS before the bundle installed
    // `RN$AppRegistry` and crashes; an empty-surface start would need the host's cooperation.)
    if ([[NSProcessInfo processInfo] systemUptime] < deadline) {
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 4 * NSEC_PER_MSEC), dispatch_get_main_queue(), ^{
        [self tryHydrateUntil:deadline];
      });
    } else {
      [self log:@"hydration: app surface did not appear in time"];
    }
    return;
  }
  if (!empty) {
    [self log:@"hydration: React already committed, skipping"];
    return;
  }
  if (surfaceId != _snapshotRootTag) {
    [self log:[NSString stringWithFormat:@"hydration: surface %d but snapshot was taken on %ld, skipping", surfaceId, (long)_snapshotRootTag]];
    return;
  }

  // The snapshot's structure above React's root component view (the hosting view, the surface
  // view) is UIKit; React's children hang directly off the surface's root node.
  const folly::dynamic *reactRoot = nullptr;
  std::function<void(const folly::dynamic &)> findRoot = [&](const folly::dynamic &n) {
    if (reactRoot) return;
    if (n.count("tag") != 0 && n["tag"].isInt() && n["tag"].asInt() == surfaceId) {
      reactRoot = &n;
      return;
    }
    if (n.count("children") != 0) {
      for (const auto &child : n["children"]) findRoot(child);
    }
  };
  findRoot(_snapshotTemplate);
  if (!reactRoot) {
    [self log:@"hydration: snapshot has no React root view, skipping"];
    return;
  }
  // Touches would reach views whose event emitters have no React instance behind them yet.
  rootView.userInteractionEnabled = NO;
  try {
    HydrationBuilder builder(*uiManager, surfaceId);
    auto children = std::make_shared<std::vector<std::shared_ptr<const ShadowNode>>>();
    builder.buildRootChildren(*reactRoot, *children);
    // Watch the transactions that follow: hold React's deletes of these nodes, adopt on matching creates.
    __weak SplashScreenPrerender *weakSelf = self;
    _transactionWatcher = std::make_shared<TransactionWatcher>(builder.prerenderedTags(), [weakSelf](TransactionWatcher::Stats stats) {
      dispatch_async(dispatch_get_main_queue(), ^{
        [weakSelf didObserveTransaction:stats];
      });
    });
    coordinator->setMountingOverrideDelegate(_transactionWatcher);
    uiManager->completeSurface(surfaceId, children, ShadowTree::CommitOptions{.mountSynchronously = true});
    _hydrated = YES;
    _awaitingReactTransaction = YES;
    [self log:[NSString stringWithFormat:@"hydration: committed %d nodes into surface %d, %d with React's tags and components", builder.created(), surfaceId, builder.reused()]];
  } catch (const std::exception &e) {
    rootView.userInteractionEnabled = YES;
    NSLog(@"[expo-splash-screen] prerender: hydration failed: %s", e.what());
  }
}

- (void)didObserveTransaction:(TransactionWatcher::Stats)stats
{
  _lastTransactionTime = [[NSProcessInfo processInfo] systemUptime];
  _adoptedTotal += stats.adopted;
  if (stats.create + stats.insert + stats.update + stats.remove + stats.del > 0) {
    [self log:[NSString stringWithFormat:@"transaction #%d: %d create, %d insert, %d update (%d adopted prerendered views), %d remove, %d delete, %d prerendered views still held",
                                         stats.number, stats.create, stats.insert, stats.update, stats.adopted, stats.remove, stats.del, stats.held]];
  }
  if (!_awaitingReactTransaction || stats.isHydrationCommit || stats.create + stats.insert + stats.update + stats.remove + stats.del == 0) {
    return;
  }
  _awaitingReactTransaction = NO;
  _reactCommitted = YES;
  _appRootView.userInteractionEnabled = YES;
  [self log:@"hydration: React's first commit landed, interaction enabled"];
  // The hosting view already reported "content did appear" for the hydration mount (ignored by the
  // splash screen manager); React's own first content is what the app is waiting for.
  [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTContentDidAppearNotification" object:_appRootView];
  if (_pendingCaptureDelay > 0) {
    NSTimeInterval delay = _pendingCaptureDelay;
    _pendingCaptureDelay = 0;
    [self captureLaunchScreenAfterDelay:delay];
  }
}

- (BOOL)shouldIgnoreContentDidAppear
{
  return _hydrated && !_reactCommitted;
}

/// The app hid the splash screen: its first screen is up. Once React has been quiet for a moment,
/// the prerendered views it did not adopt are removed.
- (void)finishHydration
{
  if (!_transactionWatcher || !_transactionWatcher->isActive() || _flushPending) {
    return;
  }
  _flushPending = YES;
  [self log:[NSString stringWithFormat:@"hydration: splash hidden, %lu prerendered views still held, waiting for React to settle", (unsigned long)_transactionWatcher->heldTags().size()]];
  [self flushHydrationIfSettled];
}

- (void)flushHydrationIfSettled
{
  if (!_flushPending || !_transactionWatcher || !_transactionWatcher->isActive()) {
    return;
  }
  NSTimeInterval quietFor = [[NSProcessInfo processInfo] systemUptime] - _lastTransactionTime;
  if (quietFor < 0.25) {
    __weak SplashScreenPrerender *weakSelf = self;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)((0.25 - quietFor) * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [weakSelf flushHydrationIfSettled];
    });
    return;
  }
  _flushPending = NO;
  UIView *rootView = _appRootView;
  id<RCTSurfaceProtocol> surface = [rootView isKindOfClass:[RCTSurfaceHostingProxyRootView class]] ? ((RCTSurfaceHostingProxyRootView *)rootView).surface : nil;
  RCTSurfacePresenter *presenter = surface ? [(NSObject *)surface valueForKey:@"surfacePresenter"] : nil;
  RCTComponentViewRegistry *registry = presenter.mountingManager.componentViewRegistry;
  auto held = _transactionWatcher->heldTags();
  int removed = 0;
  for (Tag tag : held) {
    UIView<RCTComponentViewProtocol> *view = [registry findComponentViewWithTag:tag];
    if (!view) {
      continue;
    }
    [view removeFromSuperview];
    if ([view isKindOfClass:[RCTViewComponentView class]]) {
      RCTComponentViewDescriptor descriptor = [registry componentViewDescriptorWithTag:tag];
      [registry enqueueComponentViewWithComponentHandle:[[view class] componentDescriptorProvider].handle tag:tag componentViewDescriptor:descriptor];
    }
    removed++;
  }
  _transactionWatcher->deactivate();
  [self log:[NSString stringWithFormat:@"hydration: done, React adopted %d prerendered views, %d removed", _adoptedTotal, removed]];
  if (_dismissPending) {
    _dismissPending = NO;
    [self dismissWithFadeDuration:_pendingDismissFade];
  }
}

#pragma mark - Main thread

- (BOOL)hasTemplate
{
  if (!_prepared) {
    return NO;
  }
  dispatch_group_wait(_prepared, dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_MSEC));
  return _preparedRoot != nullptr || _containerView != nil;
}

- (void)mountIfPrepared
{
  RCTAssertMainQueue();
  [self log:_containerView ? @"mountIfPrepared (already mounted)" : @"mountIfPrepared"];
  if (_containerView || !_prepared) {
    return;
  }
  if (dispatch_group_wait(_prepared, dispatch_time(DISPATCH_TIME_NOW, 50 * NSEC_PER_MSEC)) != 0 || !_preparedRoot) {
    return;
  }

  UIView *container = [[UIView alloc] initWithFrame:_bounds];
  container.userInteractionEnabled = NO;
  [_mountingManager attachSurfaceToView:container surfaceId:kSurfaceId];
  _containerView = container;

  RootShadowNode::Unshared preparedRoot = _preparedRoot;
  _preparedRoot = nullptr;
  auto status = _tree->commit(
      [&](const RootShadowNode &) -> RootShadowNode::Unshared { return preparedRoot; },
      ShadowTree::CommitOptions{.mountSynchronously = true});
  if (status != ShadowTree::CommitStatus::Succeeded) {
    [self dismiss];
    return;
  }
  [self log:@"mounted"];
}

- (void)showInWindowScene:(UIWindowScene *)windowScene
{
  RCTAssertMainQueue();
  [self log:@"scene connect"];
  [self mountIfPrepared];
  if (!_containerView || _window) {
    return;
  }
  UIWindow *window = [[UIWindow alloc] initWithWindowScene:windowScene];
  window.windowLevel = UIWindowLevelNormal + 1;
  window.frame = windowScene.coordinateSpace.bounds;
  UIViewController *controller = [UIViewController new];
  controller.view = _containerView;
  window.rootViewController = controller;
  window.hidden = NO;
  _window = window;
  [self log:@"shown"];
}

- (void)dismissWithFadeDuration:(NSTimeInterval)duration
{
  if (!RCTIsMainQueue()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self dismissWithFadeDuration:duration];
    });
    return;
  }
  if (_transactionWatcher && _transactionWatcher->isActive()) {
    // React is still building its tree out of (and around) the prerendered views; the overlay
    // keeps covering until it has settled, then the leftovers go and the overlay fades.
    _pendingDismissFade = duration;
    _dismissPending = YES;
    [self finishHydration];
    return;
  }
  UIView *container = _containerView;
  if (!_window || !container || duration <= 0) {
    [self dismiss];
    return;
  }
  [self log:@"fading out"];
  _window.backgroundColor = UIColor.clearColor;
  [UIView animateWithDuration:duration
                        delay:0
                      options:UIViewAnimationOptionBeginFromCurrentState
                   animations:^{
                     container.alpha = 0;
                   }
                   completion:nil];
  // Tear down on our own clock: the completion block fires early when UIKit coalesces the animation.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(duration * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self dismiss];
  });
}

- (void)dismiss
{
  if (_window) {
    [self log:@"dismissed"];
  }
  if (!RCTIsMainQueue()) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [self dismiss];
    });
    return;
  }
  _window.hidden = YES;
  _window = nil;
  _containerView = nil;
  _preparedRoot = nullptr;
  _tree.reset();
  _treeDelegate.reset();
  _mountingManager = nil;
  _registry.reset();
  _providerRegistry.reset();
  _contextContainer.reset();
}

- (BOOL)isPrerenderRootView:(UIView *)view
{
  return [view isKindOfClass:[UIView class]] && view.tag == kSurfaceId;
}

@end
