#pragma once

#include <algorithm>
#include <numeric>
#include <stack>
#include <utility>
#include <vector>

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdocumentation"

#include "SkRefCnt.h"

#pragma clang diagnostic pop

namespace RNSkia {

/**
 Small container for shaders, filters, masks and effects
 */
template <typename T> class Declaration {
public:
  // Pushes to the stack
  void push(T el) { _elements.push(el); }

  // Clears and returns all elements
  std::vector<T> popAll() {
    auto size = _elements.size();
    std::vector<T> tmp;
    tmp.reserve(size);
    for (size_t i = 0; i < size; ++i) {
      tmp.push_back(_elements.top());
      _elements.pop();
    }
    std::reverse(std::begin(tmp), std::end(tmp));
    return tmp;
  }

  T pop() {
    if (_elements.size() == 0) {
      return nullptr;
    }
    auto tmp = _elements.top();
    _elements.pop();
    return tmp;
  }

  // Clears and returns through reducer function in reversed order
  T popAsOne(std::function<T(T inner, T outer)> composer) {
    auto tmp = popAll();
    std::reverse(std::begin(tmp), std::end(tmp));
    return std::accumulate(std::begin(tmp), std::end(tmp),
                           static_cast<T>(nullptr), [=](T inner, T outer) {
                             if (inner == nullptr) {
                               return outer;
                             }
                             return composer(inner, outer);
                           });
  }

  // Returns the size of the elements
  size_t size() { return _elements.size(); }

private:
  std::stack<T> _elements;
};

/**
 Small container for shaders, filters, masks and effects
 */
template <typename T> class ComposableDeclaration : public Declaration<T> {
public:
  /**
   Constructor
   */
  explicit ComposableDeclaration(std::function<T(T inner, T outer)> composer)
      : Declaration<T>(), _composer(composer) {}

  // Clears and returns through reducer function in reversed order
  T popAsOne() { return Declaration<T>::popAsOne(_composer); }

private:
  std::function<T(T inner, T outer)> _composer;
};

} // namespace RNSkia
