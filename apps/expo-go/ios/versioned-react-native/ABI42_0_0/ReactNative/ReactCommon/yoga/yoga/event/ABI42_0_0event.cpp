/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI42_0_0event.h"
#include <atomic>
#include <memory>
#include <stdexcept>

namespace ABI42_0_0facebook {
namespace yoga {

const char* LayoutPassReasonToString(const LayoutPassReason value) {
  switch (value) {
    case LayoutPassReason::kInitial:
      return "initial";
    case LayoutPassReason::kAbsLayout:
      return "abs_layout";
    case LayoutPassReason::kStretch:
      return "stretch";
    case LayoutPassReason::kMultilineStretch:
      return "multiline_stretch";
    case LayoutPassReason::kFlexLayout:
      return "flex_layout";
    case LayoutPassReason::kMeasureChild:
      return "measure";
    case LayoutPassReason::kAbsMeasureChild:
      return "abs_measure";
    case LayoutPassReason::kFlexMeasure:
      return "flex_measure";
    default:
      return "unknown";
  }
}

namespace {

struct Node {
  std::function<Event::Subscriber> subscriber = nullptr;
  Node* next = nullptr;

  Node(std::function<Event::Subscriber>&& subscriber)
      : subscriber{std::move(subscriber)} {}
};

std::atomic<Node*> subscribers{nullptr};

Node* push(Node* newHead) {
  Node* oldHead;
  do {
    oldHead = subscribers.load(std::memory_order_relaxed);
    if (newHead != nullptr) {
      newHead->next = oldHead;
    }
  } while (!subscribers.compare_exchange_weak(
      oldHead, newHead, std::memory_order_release, std::memory_order_relaxed));
  return oldHead;
}

} // namespace

void Event::reset() {
  auto head = push(nullptr);
  while (head != nullptr) {
    auto current = head;
    head = head->next;
    delete current;
  }
}

void Event::subscribe(std::function<Subscriber>&& subscriber) {
  push(new Node{std::move(subscriber)});
}

void Event::publish(const ABI42_0_0YGNode& node, Type eventType, const Data& eventData) {
  for (auto subscriber = subscribers.load(std::memory_order_relaxed);
       subscriber != nullptr;
       subscriber = subscriber->next) {
    subscriber->subscriber(node, eventType, eventData);
  }
}

} // namespace yoga
} // namespace ABI42_0_0facebook
