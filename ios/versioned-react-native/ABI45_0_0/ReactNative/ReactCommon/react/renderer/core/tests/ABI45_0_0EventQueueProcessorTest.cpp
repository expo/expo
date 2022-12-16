/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <gtest/gtest.h>
#include <hermes/API/hermes/hermes.h>
#include <ABI45_0_0jsi/ABI45_0_0jsi.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/EventPipe.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/EventQueueProcessor.h>
#include <ABI45_0_0React/ABI45_0_0renderer/core/StatePipe.h>

#include <memory>

namespace ABI45_0_0facebook::ABI45_0_0React {

class EventQueueProcessorTest : public testing::Test {
 protected:
  void SetUp() override {
    runtime_ = ABI45_0_0facebook::hermes::makeHermesRuntime();

    auto eventPipe = [this](
                         jsi::Runtime &runtime,
                         const EventTarget *eventTarget,
                         const std::string &type,
                         ABI45_0_0ReactEventPriority priority,
                         const ValueFactory &payloadFactory) {
      eventTypes_.push_back(type);
      eventPriorities_.push_back(priority);
    };

    auto dummyStatePipe = [](StateUpdate const &stateUpdate) {};

    eventProcessor_ =
        std::make_unique<EventQueueProcessor>(eventPipe, dummyStatePipe);
  }

  std::unique_ptr<ABI45_0_0facebook::hermes::HermesRuntime> runtime_;
  std::unique_ptr<EventQueueProcessor> eventProcessor_;
  std::vector<std::string> eventTypes_;
  std::vector<ABI45_0_0ReactEventPriority> eventPriorities_;
  ValueFactory dummyValueFactory_;
};

TEST_F(EventQueueProcessorTest, singleUnspecifiedEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
          "my type",
          dummyValueFactory_,
          nullptr,
          RawEvent::Category::Unspecified)});

  ABI45_0_0EXPECT_EQ(eventPriorities_.size(), 1);
  ABI45_0_0EXPECT_EQ(eventTypes_[0], "my type");
  ABI45_0_0EXPECT_EQ(eventPriorities_[0], ABI45_0_0ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, continiousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {RawEvent(
           "touchStart",
           dummyValueFactory_,
           nullptr,
           RawEvent::Category::ContinuousStart),
       RawEvent(
           "touchMove",
           dummyValueFactory_,
           nullptr,
           RawEvent::Category::Unspecified),
       RawEvent(
           "touchEnd",
           dummyValueFactory_,
           nullptr,
           RawEvent::Category::ContinuousEnd),
       RawEvent(
           "custom event",
           dummyValueFactory_,
           nullptr,
           RawEvent::Category::Unspecified)});

  ABI45_0_0EXPECT_EQ(eventPriorities_.size(), 4);

  ABI45_0_0EXPECT_EQ(eventTypes_[0], "touchStart");
  ABI45_0_0EXPECT_EQ(eventPriorities_[0], ABI45_0_0ReactEventPriority::Discrete);

  ABI45_0_0EXPECT_EQ(eventTypes_[1], "touchMove");
  ABI45_0_0EXPECT_EQ(eventPriorities_[1], ABI45_0_0ReactEventPriority::Default);

  ABI45_0_0EXPECT_EQ(eventTypes_[2], "touchEnd");
  ABI45_0_0EXPECT_EQ(eventPriorities_[2], ABI45_0_0ReactEventPriority::Discrete);

  ABI45_0_0EXPECT_EQ(eventTypes_[3], "custom event");
  ABI45_0_0EXPECT_EQ(eventPriorities_[3], ABI45_0_0ReactEventPriority::Discrete);
}

TEST_F(EventQueueProcessorTest, alwaysContinuousEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onScroll",
              dummyValueFactory_,
              nullptr,
              RawEvent::Category::Continuous),
      });

  ABI45_0_0EXPECT_EQ(eventPriorities_.size(), 1);

  ABI45_0_0EXPECT_EQ(eventTypes_[0], "onScroll");
  ABI45_0_0EXPECT_EQ(eventPriorities_[0], ABI45_0_0ReactEventPriority::Default);
}

TEST_F(EventQueueProcessorTest, alwaysDiscreteEvent) {
  eventProcessor_->flushEvents(
      *runtime_,
      {
          RawEvent(
              "onChange",
              dummyValueFactory_,
              nullptr,
              RawEvent::Category::Discrete),
      });

  ABI45_0_0EXPECT_EQ(eventPriorities_.size(), 1);

  ABI45_0_0EXPECT_EQ(eventTypes_[0], "onChange");
  ABI45_0_0EXPECT_EQ(eventPriorities_[0], ABI45_0_0ReactEventPriority::Discrete);
}

} // namespace ABI45_0_0facebook::ABI45_0_0React
