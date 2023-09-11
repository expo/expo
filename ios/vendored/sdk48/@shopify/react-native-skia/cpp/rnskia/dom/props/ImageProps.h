#pragma once

#include "DerivedNodeProp.h"

#include "JsiSkImage.h"

#include <algorithm>
#include <memory>
#include <string>

namespace ABI48_0_0RNSkia {

struct FitSizes {
  SkSize src;
  SkSize dst;
};

struct FitRects {
  SkRect src;
  SkRect dst;
};

static PropId PropNameImage = JsiPropId::get("image");
static PropId PropNameFit = JsiPropId::get("fit");

class ImageProp : public DerivedSkProp<SkImage> {
public:
  explicit ImageProp(PropId name) : DerivedSkProp<SkImage>() {
    _imageProp = addProperty(std::make_shared<NodeProp>(name));
  }

  void updateDerivedValue() override {
    if (!_imageProp->isSet() ||
        _imageProp->value().getType() != PropType::HostObject) {
      throw std::runtime_error("Expected SkImage object for the " +
                               std::string(getName()) + " property.");
    }

    auto ptr = std::dynamic_pointer_cast<JsiSkImage>(
        _imageProp->value().getAsHostObject());
    if (ptr == nullptr) {
      throw std::runtime_error("Expected SkImage object for the " +
                               std::string(getName()) + " property.");
    }

    setDerivedValue(ptr->getObject());
  }

private:
  NodeProp *_imageProp;
};

class ImageProps : public DerivedProp<FitRects> {
public:
  ImageProps() : DerivedProp<FitRects>() {
    _fitProp = addProperty(std::make_shared<NodeProp>(PropNameFit));
    _imageProp = addProperty(std::make_shared<ImageProp>(PropNameImage));
    _rectProp = addProperty(std::make_shared<RectProps>(PropNameRect));
  }

  void updateDerivedValue() override {
    if (!_imageProp->isSet()) {
      throw std::runtime_error("Image property is not set on the Image node.");
    }

    auto image = _imageProp->getDerivedValue();
    auto imageRect = SkRect::MakeXYWH(0, 0, image->width(), image->height());

    auto rect = _rectProp->getDerivedValue() ? *_rectProp->getDerivedValue()
                                             : imageRect;
    auto fit = _fitProp->isSet() ? _fitProp->value().getAsString() : "contain";

    setDerivedValue(fitRects(fit, imageRect, rect));
  }

  sk_sp<SkImage> getImage() { return _imageProp->getDerivedValue(); }
  std::shared_ptr<const SkRect> getRect() {
    return _rectProp->getDerivedValue();
  }

  SkMatrix rect2rect(SkRect src, SkRect dst) {
    auto sx = dst.width() / src.width();
    auto sy = dst.height() / src.height();
    auto tx = dst.x() - src.x() * sx;
    auto ty = dst.y() - src.y() * sy;
    SkMatrix m3;
    m3.preTranslate(tx, ty);
    m3.preScale(sx, sy);
    return m3;
  }

private:
  SkSize size(double width, double height) {
    return SkSize::Make(width, height);
  }

  FitRects fitRects(const std::string &fit, SkRect rect, SkRect rect2) {
    auto sizes = applyBoxFit(fit, size(rect.width(), rect.height()),
                             size(rect2.width(), rect2.height()));

    auto src = inscribe(sizes.src, rect);
    auto dst = inscribe(sizes.dst, rect2);

    return {.src = src, .dst = dst};
  }

  SkRect inscribe(SkSize size, SkRect rect) {
    auto halfWidthDelta = (rect.width() - size.width()) / 2.0;
    auto halfHeightDelta = (rect.height() - size.height()) / 2.0;
    return SkRect::MakeXYWH(rect.x() + halfWidthDelta,
                            rect.y() + halfHeightDelta, size.width(),
                            size.height());
  }

  FitSizes applyBoxFit(const std::string fit, SkSize input, SkSize output) {
    SkSize src = size(0, 0);
    SkSize dst = size(0, 0);

    if (input.height() <= 0.0 || input.width() <= 0.0 ||
        output.height() <= 0.0 || output.width() <= 0.0) {
      return {.src = src, .dst = dst};
    }

    if (fit == "fill") {
      src = input;
      dst = output;
    } else if (fit == "contain") {
      src = input;
      if (output.width() / output.height() > src.width() / src.height()) {
        dst = size((src.width() * output.height()) / src.height(),
                   output.height());
      } else {
        dst =
            size(output.width(), (src.height() * output.width()) / src.width());
      }
    } else if (fit == "cover") {
      if (output.width() / output.height() > input.width() / input.height()) {
        src = size(input.width(),
                   (input.width() * output.height()) / output.width());
      } else {
        src = size((input.height() * output.width()) / output.height(),
                   input.height());
      }
      dst = output;
    } else if (fit == "fitWidth") {
      src = size(input.width(),
                 (input.width() * output.height()) / output.width());
      dst = size(output.width(), (src.height() * output.width()) / src.width());
    } else if (fit == "fitHeight") {
      src = size((input.height() * output.width()) / output.height(),
                 input.height());
      dst =
          size((src.width() * output.height()) / src.height(), output.height());
    } else if (fit == "none") {
      src = size(std::min(input.width(), output.width()),
                 std::min(input.height(), output.height()));
      dst = src;
    } else if (fit == "scaleDown") {
      src = input;
      dst = input;
      auto aspectRatio = input.width() / input.height();
      if (dst.height() > output.height()) {
        dst = size(output.height() * aspectRatio, output.height());
      }
      if (dst.width() > output.width()) {
        dst = size(output.width(), output.width() / aspectRatio);
      }
    } else {
      throw std::runtime_error("The value \"" + fit +
                               "\" is not a valid fit value.");
    }
    return {.src = src, .dst = dst};
  }

  NodeProp *_fitProp;
  ImageProp *_imageProp;
  RectProps *_rectProp;
};
} // namespace ABI48_0_0RNSkia
