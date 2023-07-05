#pragma once

#include "JsiDomDrawingNode.h"
#include "PathProp.h"

#include <algorithm>
#include <memory>
#include <string>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkTrimPathEffect.h"

#pragma clang diagnostic pop

namespace RNSkia {

static PropId PropNameMiterLimit = JsiPropId::get("miter_limit");
static PropId PropNamePrecision = JsiPropId::get("precision");

class JsiPathNode : public JsiDomDrawingNode,
                    public JsiDomNodeCtor<JsiPathNode> {
public:
  explicit JsiPathNode(std::shared_ptr<RNSkPlatformContext> context)
      : JsiDomDrawingNode(context, "skPath") {}

protected:
  void draw(DrawingContext *context) override {
    if (getPropsContainer()->isChanged()) {
      auto start = saturate(
          _startProp->isSet() ? _startProp->value().getAsNumber() : 0.0);
      auto end =
          saturate(_endProp->isSet() ? _endProp->value().getAsNumber() : 1.0);
      // Can we use the path directly, or do we need to copy to
      // mutate / modify the path?
      auto hasStartOffset = start != 0.0;
      auto hasEndOffset = end != 1.0;
      auto hasFillStyle = _fillTypeProp->isSet();
      auto hasStrokeOptions =
          _strokeOptsProp->isSet() &&
          _strokeOptsProp->value().getType() == PropType::Object;

      auto willMutatePath = hasStartOffset == true || hasEndOffset == true ||
                            hasFillStyle == true || hasStrokeOptions == true;

      if (willMutatePath) {
        // We'll trim the path
        SkPath filteredPath(*_pathProp->getDerivedValue());
        auto pe =
            SkTrimPathEffect::Make(start, end, SkTrimPathEffect::Mode::kNormal);

        if (pe != nullptr) {
          SkStrokeRec rec(SkStrokeRec::InitStyle::kHairline_InitStyle);
          if (!pe->filterPath(&filteredPath, filteredPath, &rec, nullptr)) {
            throw std::runtime_error(
                "Failed trimming path with parameters start: " +
                std::to_string(start) + ", end: " + std::to_string(end));
          }
          filteredPath.swap(filteredPath);
          _path = std::make_shared<const SkPath>(filteredPath);
        } else if (hasStartOffset || hasEndOffset) {
          throw std::runtime_error(
              "Failed trimming path with parameters start: " +
              std::to_string(start) + ", end: " + std::to_string(end));
        } else {
          _path = std::make_shared<const SkPath>(filteredPath);
        }

        // Set fill style
        if (_fillTypeProp->isSet()) {
          auto fillType = _fillTypeProp->value().getAsString();
          auto p = std::make_shared<SkPath>(*_path.get());
          p->setFillType(getFillTypeFromStringValue(fillType));
          _path = std::const_pointer_cast<const SkPath>(p);
        }

        // do we have a special paint here?
        if (_strokeOptsProp->isSet()) {
          auto opts = _strokeOptsProp->value();
          SkPaint strokePaint;

          if (opts.hasValue(JsiPropId::get("strokeCap"))) {
            strokePaint.setStrokeCap(StrokeCapProp::getCapFromString(
                opts.getValue(JsiPropId::get("strokeCap")).getAsString()));
          }

          if (opts.hasValue(JsiPropId::get("strokeJoin"))) {
            strokePaint.setStrokeJoin(StrokeJoinProp::getJoinFromString(
                opts.getValue(JsiPropId::get("strokeJoin")).getAsString()));
          }

          if (opts.hasValue(PropNameWidth)) {
            strokePaint.setStrokeWidth(
                opts.getValue(PropNameWidth).getAsNumber());
          }

          if (opts.hasValue(PropNameMiterLimit)) {
            strokePaint.setStrokeMiter(
                opts.getValue(PropNameMiterLimit).getAsNumber());
          }

          double precision = 1.0;
          if (opts.hasValue(PropNamePrecision)) {
            precision = opts.getValue(PropNamePrecision).getAsNumber();
          }

          // _path is const so we can't mutate it directly, let's replace the
          // path like this:
          auto p = std::make_shared<SkPath>(*_path.get());
          if (!skpathutils::FillPathWithPaint(*_path.get(), strokePaint,
                                              p.get(), nullptr, precision)) {
            _path = nullptr;
          } else {
            _path = std::const_pointer_cast<const SkPath>(p);
          }
        }

      } else {
        // We'll just draw the pure path
        _path = _pathProp->getDerivedValue();
      }
    }

    if (_path == nullptr) {
      throw std::runtime_error(
          "Path node could not resolve path props correctly.");
    }

    context->getCanvas()->drawPath(*_path, *context->getPaint());
  }

  void defineProperties(NodePropsContainer *container) override {
    JsiDomDrawingNode::defineProperties(container);
    _pathProp = container->defineProperty<PathProp>("path");
    _startProp = container->defineProperty<NodeProp>("start");
    _endProp = container->defineProperty<NodeProp>("end");
    _fillTypeProp = container->defineProperty<NodeProp>("fillType");
    _strokeOptsProp = container->defineProperty<NodeProp>("stroke");

    _pathProp->require();
  }

private:
  float saturate(float x) { return std::max(0.0f, std::min(1.0f, x)); }

  SkPathFillType getFillTypeFromStringValue(const std::string &value) {
    if (value == "winding") {
      return SkPathFillType::kWinding;
    } else if (value == "evenOdd") {
      return SkPathFillType::kEvenOdd;
    } else if (value == "inverseWinding") {
      return SkPathFillType::kInverseWinding;
    } else if (value == "inverseEvenOdd") {
      return SkPathFillType::kInverseEvenOdd;
    }
    throw std::runtime_error("Could not convert value \"" + value +
                             "\" to path fill type.");
  }

  PathProp *_pathProp;
  NodeProp *_startProp;
  NodeProp *_endProp;
  NodeProp *_fillTypeProp;
  NodeProp *_strokeOptsProp;

  std::shared_ptr<const SkPath> _path;
};

class StrokeOptsProps : public BaseDerivedProp {
public:
  explicit StrokeOptsProps(const std::function<void(BaseNodeProp *)> &onChange)
      : BaseDerivedProp(onChange) {
    _strokeProp = defineProperty<NodeProp>("stroke");
  }

private:
  NodeProp *_strokeProp;
};

} // namespace RNSkia
