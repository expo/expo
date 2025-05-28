#pragma once

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook::react
{

  class PeekAndPopPreviewState
  {
  public:
    PeekAndPopPreviewState() = default;
    PeekAndPopPreviewState(float width, float height)
        : width_(width), height_(height) {}

#ifdef ANDROID
    PeekAndPopPreviewState(PeekAndPopPreviewState const &previousState, folly::dynamic data) {};
    folly::dynamic getDynamic() const
    {
      return {};
    };
#endif
    float getWidth() const
    {
      return width_;
    }
    float getHeight() const
    {
      return height_;
    }

  private:
    const float width_{};
    const float height_{};
  };

} // namespace facebook::react
