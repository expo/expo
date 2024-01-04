#pragma once

#include "Declaration.h"

#include <memory>
#include <stack>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkColorFilter.h"
#include "SkImageFilter.h"
#include "SkImageFilters.h"
#include "SkMaskFilter.h"
#include "SkPaint.h"
#include "SkPathEffect.h"
#include "SkShader.h"

#pragma clang diagnostic pop

namespace RNSkia {

class DeclarationContext {
public:
  DeclarationContext() { save(); }

  Declaration<sk_sp<SkShader>> *getShaders() { return &_shaders.top(); }
  ComposableDeclaration<sk_sp<SkImageFilter>> *getImageFilters() {
    return &_imageFilters.top();
  }
  ComposableDeclaration<sk_sp<SkColorFilter>> *getColorFilters() {
    return &_colorFilters.top();
  }
  ComposableDeclaration<sk_sp<SkPathEffect>> *getPathEffects() {
    return &_pathEffects.top();
  }
  Declaration<sk_sp<SkMaskFilter>> *getMaskFilters() {
    return &_maskFilters.top();
  }
  Declaration<std::shared_ptr<SkPaint>> *getPaints() { return &_paints.top(); }

  void save() {
    _paints.emplace();
    _shaders.emplace();
    _imageFilters.emplace(
        [](sk_sp<SkImageFilter> inner, sk_sp<SkImageFilter> outer) {
          return SkImageFilters::Compose(outer, inner);
        });
    _colorFilters.emplace(
        [](sk_sp<SkColorFilter> inner, sk_sp<SkColorFilter> outer) {
          return SkColorFilters::Compose(outer, inner);
        });
    _pathEffects.emplace(
        [](sk_sp<SkPathEffect> inner, sk_sp<SkPathEffect> outer) {
          return SkPathEffect::MakeCompose(outer, inner);
        });
    _maskFilters.emplace();
  }

  void restore() {
    _shaders.pop();
    _imageFilters.pop();
    _colorFilters.pop();
    _pathEffects.pop();
    _maskFilters.pop();
    _paints.pop();
  }

private:
  std::stack<Declaration<sk_sp<SkShader>>> _shaders;
  std::stack<ComposableDeclaration<sk_sp<SkImageFilter>>> _imageFilters;
  std::stack<ComposableDeclaration<sk_sp<SkColorFilter>>> _colorFilters;
  std::stack<ComposableDeclaration<sk_sp<SkPathEffect>>> _pathEffects;
  std::stack<Declaration<sk_sp<SkMaskFilter>>> _maskFilters;
  std::stack<Declaration<std::shared_ptr<SkPaint>>> _paints;
};

} // namespace RNSkia
