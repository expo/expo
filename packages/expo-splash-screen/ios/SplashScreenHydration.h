// Copyright 2015-present 650 Industries. All rights reserved.

#ifdef __cplusplus

#import <folly/dynamic.h>
#import <react/renderer/core/RawProps.h>
#import <react/renderer/mounting/MountingOverrideDelegate.h>
#import <react/renderer/mounting/MountingTransaction.h>
#import <react/renderer/uimanager/UIManager.h>

#import <cstring>
#import <functional>
#import <unordered_map>
#import <unordered_set>

namespace expo {

using namespace facebook::react;

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
class SplashScreenTransactionWatcher : public MountingOverrideDelegate {
 public:
  struct Stats {
    int adopted{};
    bool isEmpty{};
    bool isHydrationCommit{};
  };

  SplashScreenTransactionWatcher(
      std::unordered_set<Tag> prerendered,
      std::function<void(Tag)> onAdopt,
      std::function<void(Stats)> onTransaction)
      : prerendered_(std::move(prerendered)), onAdopt_(std::move(onAdopt)), onTransaction_(std::move(onTransaction))
  {
  }

  bool isActive() const
  {
    return active_;
  }

  std::vector<Tag> heldTags() const
  {
    std::vector<Tag> tags;
    for (const auto &entry : heldDeletes_) {
      tags.push_back(entry.first);
    }
    return tags;
  }

  void deactivate()
  {
    active_ = false;
    heldDeletes_.clear();
    heldRemoves_.clear();
  }

  bool shouldOverridePullTransaction() const override
  {
    return true;
  }

  std::optional<MountingTransaction> pullTransaction(
      SurfaceId surfaceId,
      MountingTransaction::Number number,
      const TransactionTelemetry &telemetry,
      ShadowViewMutationList mutations) const override
  {
    Stats stats;
    // The first transaction this watcher sees is the hydration commit itself.
    stats.isHydrationCommit = !sawFirst_;
    sawFirst_ = true;
    ShadowViewMutationList out;
    out.reserve(mutations.size());
    for (auto &mutation : mutations) {
      if (active_) {
        Tag tag = mutation.type == ShadowViewMutation::Create || mutation.type == ShadowViewMutation::Insert ||
                mutation.type == ShadowViewMutation::Update
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
              // The view leaves the prerendered tree now, outside the mutation stream: a `Remove`
              // mutation here has a stale index, and that breaks delegates that mirror the stream.
              onAdopt_(tag);
              out.push_back(ShadowViewMutation::UpdateMutation(
                  old, mutation.newChildShadowView, removed != heldRemoves_.end() ? removed->second.parentTag : -1));
              adopted_.insert(tag);
              heldDeletes_.erase(held);
              if (removed != heldRemoves_.end()) {
                heldRemoves_.erase(removed);
              }
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
    stats.isEmpty = out.empty();
    onTransaction_(stats);
    return MountingTransaction{surfaceId, number, std::move(out), telemetry};
  }

 private:
  bool isHeldCandidate(Tag tag) const
  {
    return prerendered_.count(tag) != 0 && adopted_.count(tag) == 0;
  }

  std::unordered_set<Tag> prerendered_;
  std::function<void(Tag)> onAdopt_;
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
class SplashScreenHydrationBuilder {
 public:
  SplashScreenHydrationBuilder(const UIManager &uiManager, SurfaceId surfaceId) : uiManager_(uiManager), surfaceId_(surfaceId) {}

  /**
   Nodes created here have event targets with no React instance behind them, and the first event a
   native view emits on its own (`onInsetsChange` from a safe-area provider, scroll and layout
   events) would crash in `UIManagerBinding::dispatchEvent`. Native containers that drive UIKit
   controllers (react-native-screens) also cannot be instantiated from a props subset. Only `View`
   and `Paragraph` keep React's tag and component. The rest are plain views with fresh tags, and
   React creates the real ones (their prerendered children still get adopted).
   */
  static bool canReuseTag(const std::string &component)
  {
    return component == "View" || component == "Paragraph";
  }

  /// Root children: the tagged nodes right below React's root view.
  void buildRootChildren(const folly::dynamic &rootNode, std::vector<std::shared_ptr<const ShadowNode>> &out)
  {
    collectChildren(rootNode, out);
  }

  const std::unordered_set<Tag> &prerenderedTags() const
  {
    return prerendered_;
  }

  int created() const
  {
    return created_;
  }

  int reused() const
  {
    return reused_;
  }

 private:
  static folly::dynamic propsOf(const folly::dynamic &node)
  {
    return node.count("props") != 0 && node["props"].isObject() ? node["props"] : folly::dynamic::object();
  }

  std::shared_ptr<const ShadowNode> buildTagged(const folly::dynamic &node)
  {
    Tag tag = (Tag)node["tag"].asInt();
    std::string component = node.count("component") != 0 && node["component"].isString() ? node["component"].asString() : node["name"].asString();
    folly::dynamic props = propsOf(node);
    std::shared_ptr<ShadowNode> shadowNode;
    if (canReuseTag(component)) {
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
    auto shadowNode = uiManager_.createNode(tag, node["name"].asString(), surfaceId_, RawProps(propsOf(node)), nullptr);
    prerendered_.insert(tag);
    created_++;
    if (node.count("children") != 0 && node["children"].isArray()) {
      for (const auto &child : node["children"]) {
        uiManager_.appendChild(shadowNode, buildText(child));
      }
    }
    return shadowNode;
  }

  // Odd tags: React allocates even ones, roots end in 1. Far above the tags of the overlay tree.
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
  Tag nextTag_ = 2000003;
  int created_ = 0;
  int reused_ = 0;
};

} // namespace expo

#endif
