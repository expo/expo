/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <vector>
#include <array>
#include <ABI42_0_0yoga/ABI42_0_0YGEnums.h>

struct ABI42_0_0YGConfig;
struct ABI42_0_0YGNode;

namespace ABI42_0_0facebook {
namespace yoga {

enum struct LayoutType : int {
  kLayout = 0,
  kMeasure = 1,
  kCachedLayout = 2,
  kCachedMeasure = 3
};

enum struct LayoutPassReason : int {
  kInitial = 0,
  kAbsLayout = 1,
  kStretch = 2,
  kMultilineStretch = 3,
  kFlexLayout = 4,
  kMeasureChild = 5,
  kAbsMeasureChild = 6,
  kFlexMeasure = 7,
  COUNT
};

struct LayoutData {
  int layouts;
  int measures;
  int maxMeasureCache;
  int cachedLayouts;
  int cachedMeasures;
  int measureCallbacks;
  std::array<int, static_cast<uint8_t>(LayoutPassReason::COUNT)>
      measureCallbackReasonsCount;
};

const char* LayoutPassReasonToString(const LayoutPassReason value);

struct YOGA_EXPORT Event {
  enum Type {
    NodeAllocation,
    NodeDeallocation,
    NodeLayout,
    LayoutPassStart,
    LayoutPassEnd,
    MeasureCallbackStart,
    MeasureCallbackEnd,
    NodeBaselineStart,
    NodeBaselineEnd,
  };
  class Data;
  using Subscriber = void(const ABI42_0_0YGNode&, Type, Data);
  using Subscribers = std::vector<std::function<Subscriber>>;

  template <Type E>
  struct TypedData {};

  class Data {
    const void* data_;

  public:
    template <Type E>
    Data(const TypedData<E>& data) : data_{&data} {}

    template <Type E>
    const TypedData<E>& get() const {
      return *static_cast<const TypedData<E>*>(data_);
    };
  };

  static void reset();

  static void subscribe(std::function<Subscriber>&& subscriber);

  template <Type E>
  static void publish(const ABI42_0_0YGNode& node, const TypedData<E>& eventData = {}) {
#ifdef ABI42_0_0YG_ENABLE_EVENTS
    publish(node, E, Data{eventData});
#endif
  }

  template <Type E>
  static void publish(const ABI42_0_0YGNode* node, const TypedData<E>& eventData = {}) {
    publish<E>(*node, eventData);
  }

private:
  static void publish(const ABI42_0_0YGNode&, Type, const Data&);
};

template <>
struct Event::TypedData<Event::NodeAllocation> {
  ABI42_0_0YGConfig* config;
};

template <>
struct Event::TypedData<Event::NodeDeallocation> {
  ABI42_0_0YGConfig* config;
};

template <>
struct Event::TypedData<Event::LayoutPassStart> {
  void* layoutContext;
};

template <>
struct Event::TypedData<Event::LayoutPassEnd> {
  void* layoutContext;
  LayoutData* layoutData;
};

template <>
struct Event::TypedData<Event::MeasureCallbackEnd> {
  void* layoutContext;
  float width;
  ABI42_0_0YGMeasureMode widthMeasureMode;
  float height;
  ABI42_0_0YGMeasureMode heightMeasureMode;
  float measuredWidth;
  float measuredHeight;
  const LayoutPassReason reason;
};

template <>
struct Event::TypedData<Event::NodeLayout> {
  LayoutType layoutType;
  void* layoutContext;
};

} // namespace yoga
} // namespace ABI42_0_0facebook
