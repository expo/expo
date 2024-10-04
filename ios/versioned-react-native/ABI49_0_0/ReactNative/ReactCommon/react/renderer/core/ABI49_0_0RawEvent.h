/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <ABI49_0_0React/renderer/core/ABI49_0_0EventLogger.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0EventTarget.h>
#include <ABI49_0_0React/renderer/core/ABI49_0_0ValueFactory.h>

namespace ABI49_0_0facebook {
namespace ABI49_0_0React {

/*
 * Represents ready-to-dispatch event object.
 */
struct RawEvent {
  /*
   * Defines category of a native platform event. This is used to deduce types
   * of events for Concurrent Mode.
   * This enum is duplicated for JNI access in `EventCategoryDef.java`, keep in
   * sync.
   */
  enum class Category {
    /*
     * Start of a continuous event. To be used with touchStart.
     */
    ContinuousStart = 0,

    /*
     * End of a continuous event. To be used with touchEnd.
     */
    ContinuousEnd = 1,

    /*
     * Priority for this event will be determined from other events in the
     * queue. If it is triggered by continuous event, its priority will be
     * default. If it is not triggered by continuous event, its priority will be
     * discrete.
     */
    Unspecified = 2,

    /*
     * Forces discrete type for the event. Regardless if continuous event is
     * ongoing.
     */
    Discrete = 3,

    /*
     * Forces continuous type for the event. Regardless if continuous event
     * isn't ongoing.
     */
    Continuous = 4
  };

  RawEvent(
      std::string type,
      ValueFactory payloadFactory,
      SharedEventTarget eventTarget,
      Category category = Category::Unspecified);

  std::string type;
  ValueFactory payloadFactory;
  SharedEventTarget eventTarget;
  Category category;
  EventTag loggingTag{0};
};

} // namespace ABI49_0_0React
} // namespace ABI49_0_0facebook
