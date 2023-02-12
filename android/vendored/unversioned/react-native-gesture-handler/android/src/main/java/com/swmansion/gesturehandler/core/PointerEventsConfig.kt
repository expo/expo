package com.swmansion.gesturehandler.core

enum class PointerEventsConfig {
  /**
   * Neither the container nor its children receive events.
   */
  NONE,

  /**
   * Container doesn't get events but all of its children do.
   */
  BOX_NONE,

  /**
   * Container gets events but none of its children do.
   */
  BOX_ONLY,

  /**
   * Container and all of its children receive touch events (like pointerEvents is unspecified).
   */
  AUTO
}
