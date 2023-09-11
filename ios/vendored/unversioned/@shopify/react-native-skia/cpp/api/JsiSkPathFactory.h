#pragma once

#include <memory>
#include <utility>

#include <jsi/jsi.h>

#include "JsiSkHostObjects.h"
#include "JsiSkPathEffect.h"

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "RNSkLog.h"
#include "SkPath.h"
#include "SkPathOps.h"

#pragma clang diagnostic pop

namespace RNSkia {

namespace jsi = facebook::jsi;

class JsiSkPathFactory : public JsiSkHostObject {

  static const int MOVE = 0;
  static const int LINE = 1;
  static const int QUAD = 2;
  static const int CONIC = 3;
  static const int CUBIC = 4;
  static const int CLOSE = 5;

public:
  JSI_HOST_FUNCTION(Make) {
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), SkPath()));
  }

  JSI_HOST_FUNCTION(MakeFromSVGString) {
    auto svgString = arguments[0].asString(runtime).utf8(runtime);
    SkPath result;

    if (!SkParsePath::FromSVGString(svgString.c_str(), &result)) {
      throw jsi::JSError(runtime, "Could not parse Svg path");
      return jsi::Value(nullptr);
    }

    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), std::move(result)));
  }

  JSI_HOST_FUNCTION(MakeFromOp) {
    SkPath one = *JsiSkPath::fromValue(runtime, arguments[0]).get();
    SkPath two = *JsiSkPath::fromValue(runtime, arguments[1]).get();
    SkPathOp op = (SkPathOp)arguments[2].asNumber();
    SkPath result;
    bool success = Op(one, two, op, &result);
    if (!success) {
      return jsi::Value(nullptr);
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), std::move(result)));
  }

  JSI_HOST_FUNCTION(MakeFromCmds) {
    SkPath path;
    auto cmds = arguments[0].asObject(runtime).asArray(runtime);
    auto cmdCount = cmds.size(runtime);
    for (int i = 0; i < cmdCount; i++) {
      auto cmd =
          cmds.getValueAtIndex(runtime, i).asObject(runtime).asArray(runtime);
      if (cmd.size(runtime) < 1) {
        RNSkLogger::logToConsole("Invalid command found (got an empty array)");
        return jsi::Value::null();
      }
      auto verb = static_cast<int>(cmd.getValueAtIndex(runtime, 0).asNumber());
      switch (verb) {
      case MOVE: {
        if (cmd.size(runtime) < 3) {
          RNSkLogger::logToConsole("Invalid move command found");
          return jsi::Value::null();
        }
        auto x = cmd.getValueAtIndex(runtime, 1).asNumber();
        auto y = cmd.getValueAtIndex(runtime, 2).asNumber();
        path.moveTo(x, y);
        break;
      }
      case LINE: {
        if (cmd.size(runtime) < 3) {
          RNSkLogger::logToConsole("Invalid line command found");
          return jsi::Value::null();
        }
        auto x = cmd.getValueAtIndex(runtime, 1).asNumber();
        auto y = cmd.getValueAtIndex(runtime, 2).asNumber();
        path.lineTo(x, y);
        break;
      }
      case QUAD: {
        if (cmd.size(runtime) < 5) {
          RNSkLogger::logToConsole("Invalid line command found");
          return jsi::Value::null();
        }
        auto x1 = cmd.getValueAtIndex(runtime, 1).asNumber();
        auto y1 = cmd.getValueAtIndex(runtime, 2).asNumber();
        auto x2 = cmd.getValueAtIndex(runtime, 3).asNumber();
        auto y2 = cmd.getValueAtIndex(runtime, 4).asNumber();
        path.quadTo(x1, y1, x2, y2);
        break;
      }
      case CONIC: {
        if (cmd.size(runtime) < 6) {
          RNSkLogger::logToConsole("Invalid line command found");
          return jsi::Value::null();
        }
        auto x1 = cmd.getValueAtIndex(runtime, 1).asNumber();
        auto y1 = cmd.getValueAtIndex(runtime, 2).asNumber();
        auto x2 = cmd.getValueAtIndex(runtime, 3).asNumber();
        auto y2 = cmd.getValueAtIndex(runtime, 4).asNumber();
        auto w = cmd.getValueAtIndex(runtime, 5).asNumber();
        path.conicTo(x1, y1, x2, y2, w);
        break;
      }
      case CUBIC: {
        if (cmd.size(runtime) < 7) {
          RNSkLogger::logToConsole("Invalid line command found");
          return jsi::Value::null();
        }
        auto x1 = cmd.getValueAtIndex(runtime, 1).asNumber();
        auto y1 = cmd.getValueAtIndex(runtime, 2).asNumber();
        auto x2 = cmd.getValueAtIndex(runtime, 3).asNumber();
        auto y2 = cmd.getValueAtIndex(runtime, 4).asNumber();
        auto x3 = cmd.getValueAtIndex(runtime, 5).asNumber();
        auto y3 = cmd.getValueAtIndex(runtime, 6).asNumber();
        path.cubicTo(x1, y1, x2, y2, x3, y3);
        break;
      }
      case CLOSE: {
        path.close();
        break;
      }
      default: {
        RNSkLogger::logToConsole("Found an unknown command");
        return jsi::Value::null();
      }
      }
    }
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), std::move(path)));
  }

  JSI_HOST_FUNCTION(MakeFromText) {
    auto text = arguments[0].asString(runtime).utf8(runtime);
    auto x = arguments[1].asNumber();
    auto y = arguments[2].asNumber();
    auto font = JsiSkFont::fromValue(runtime, arguments[3]);
    SkPath path;
    SkTextUtils::GetPath(text.c_str(), strlen(text.c_str()),
                         SkTextEncoding::kUTF8, x, y, *font, &path);
    return jsi::Object::createFromHostObject(
        runtime, std::make_shared<JsiSkPath>(getContext(), std::move(path)));
  }

  JSI_EXPORT_FUNCTIONS(JSI_EXPORT_FUNC(JsiSkPathFactory, Make),
                       JSI_EXPORT_FUNC(JsiSkPathFactory, MakeFromSVGString),
                       JSI_EXPORT_FUNC(JsiSkPathFactory, MakeFromOp),
                       JSI_EXPORT_FUNC(JsiSkPathFactory, MakeFromCmds),
                       JSI_EXPORT_FUNC(JsiSkPathFactory, MakeFromText))

  explicit JsiSkPathFactory(std::shared_ptr<RNSkPlatformContext> context)
      : JsiSkHostObject(std::move(context)) {}
};

} // namespace RNSkia
