#pragma once

#include "MatrixProp.h"
#include "NodeProp.h"
#include "PointProp.h"
#include "TransformProp.h"

#include <memory>
#include <utility>

namespace RNSkia {

class TransformsProps : public DerivedProp<SkMatrix> {
public:
  explicit TransformsProps(const std::function<void(BaseNodeProp *)> &onChange)
      : DerivedProp<SkMatrix>(onChange) {
    _transformProp = defineProperty<TransformProp>("transform");
    _originProp = defineProperty<PointProp>("origin");
    _matrixProp = defineProperty<MatrixProp>("matrix");
  }

  void updateDerivedValue() override {
    if (_transformProp->isSet() || _originProp->isSet() ||
        _matrixProp->isSet()) {

      auto matrix =
          _matrixProp->isSet() ? _matrixProp->getDerivedValue() : nullptr;
      auto origin =
          _originProp->isSet() ? _originProp->getDerivedValue() : nullptr;
      auto transform =
          _transformProp->isSet() ? _transformProp->getDerivedValue() : nullptr;

      auto lm = SkMatrix();
      if (matrix) {
        if (origin) {
          lm.preTranslate(origin->x(), origin->y());
          lm.preConcat(*matrix);
          lm.preTranslate(-origin->x(), -origin->y());
        } else {
          lm.setIdentity();
          lm.preConcat(*matrix);
        }
      } else if (transform) {
        lm.setIdentity();
        if (origin) {
          lm.preTranslate(origin->x(), origin->y());
        }
        lm.preConcat(*transform);
        if (origin) {
          lm.preTranslate(-origin->x(), -origin->y());
        }
      }
      setDerivedValue(std::move(lm));

    } else {
      setDerivedValue(nullptr);
    }
  }

private:
  TransformProp *_transformProp;
  PointProp *_originProp;
  MatrixProp *_matrixProp;
};

} // namespace RNSkia
