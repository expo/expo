/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ABI47_0_0Transform.h"

#include <cmath>

#include <glog/logging.h>
#include <ABI47_0_0React/ABI47_0_0debug/ABI47_0_0React_native_assert.h>

namespace ABI47_0_0facebook {
namespace ABI47_0_0React {

#ifdef ABI47_0_0RN_DEBUG_STRING_CONVERTIBLE
void Transform::print(Transform const &t, std::string prefix) {
  LOG(ERROR) << prefix << "[ " << t.matrix[0] << " " << t.matrix[1] << " "
             << t.matrix[2] << " " << t.matrix[3] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[4] << " " << t.matrix[5] << " "
             << t.matrix[6] << " " << t.matrix[7] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[8] << " " << t.matrix[9] << " "
             << t.matrix[10] << " " << t.matrix[11] << " ]";
  LOG(ERROR) << prefix << "[ " << t.matrix[12] << " " << t.matrix[13] << " "
             << t.matrix[14] << " " << t.matrix[15] << " ]";
}
#endif

Transform Transform::Identity() {
  return {};
}

Transform Transform::Perspective(Float perspective) {
  auto transform = Transform{};
  transform.operations.push_back(TransformOperation{
      TransformOperationType::Perspective, perspective, 0, 0});
  transform.matrix[11] = -1 / perspective;
  return transform;
}

Transform Transform::Scale(Float x, Float y, Float z) {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  Float zprime = isZero(z) ? 0 : z;
  if (xprime != 1 || yprime != 1 || zprime != 1) {
    transform.operations.push_back(TransformOperation{
        TransformOperationType::Scale, xprime, yprime, zprime});
    transform.matrix[0] = xprime;
    transform.matrix[5] = yprime;
    transform.matrix[10] = zprime;
  }
  return transform;
}

Transform Transform::Translate(Float x, Float y, Float z) {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  Float zprime = isZero(z) ? 0 : z;
  if (xprime != 0 || yprime != 0 || zprime != 0) {
    transform.operations.push_back(TransformOperation{
        TransformOperationType::Translate, xprime, yprime, zprime});
    transform.matrix[12] = xprime;
    transform.matrix[13] = yprime;
    transform.matrix[14] = zprime;
  }
  return transform;
}

Transform Transform::Skew(Float x, Float y) {
  auto transform = Transform{};
  Float xprime = isZero(x) ? 0 : x;
  Float yprime = isZero(y) ? 0 : y;
  transform.operations.push_back(
      TransformOperation{TransformOperationType::Skew, xprime, yprime, 0});
  transform.matrix[4] = std::tan(xprime);
  transform.matrix[1] = std::tan(yprime);
  return transform;
}

Transform Transform::RotateX(Float radians) {
  auto transform = Transform{};
  if (!isZero(radians)) {
    transform.operations.push_back(
        TransformOperation{TransformOperationType::Rotate, radians, 0, 0});
    transform.matrix[5] = std::cos(radians);
    transform.matrix[6] = std::sin(radians);
    transform.matrix[9] = -std::sin(radians);
    transform.matrix[10] = std::cos(radians);
  }
  return transform;
}

Transform Transform::RotateY(Float radians) {
  auto transform = Transform{};
  if (!isZero(radians)) {
    transform.operations.push_back(
        TransformOperation{TransformOperationType::Rotate, 0, radians, 0});
    transform.matrix[0] = std::cos(radians);
    transform.matrix[2] = -std::sin(radians);
    transform.matrix[8] = std::sin(radians);
    transform.matrix[10] = std::cos(radians);
  }
  return transform;
}

Transform Transform::RotateZ(Float radians) {
  auto transform = Transform{};
  if (!isZero(radians)) {
    transform.operations.push_back(
        TransformOperation{TransformOperationType::Rotate, 0, 0, radians});
    transform.matrix[0] = std::cos(radians);
    transform.matrix[1] = std::sin(radians);
    transform.matrix[4] = -std::sin(radians);
    transform.matrix[5] = std::cos(radians);
  }
  return transform;
}

Transform Transform::Rotate(Float x, Float y, Float z) {
  auto transform = Transform{};
  transform.operations.push_back(
      TransformOperation{TransformOperationType::Rotate, x, y, z});
  if (!isZero(x)) {
    transform = transform * Transform::RotateX(x);
  }
  if (!isZero(y)) {
    transform = transform * Transform::RotateY(y);
  }
  if (!isZero(z)) {
    transform = transform * Transform::RotateZ(z);
  }
  return transform;
}

Transform Transform::FromTransformOperation(
    TransformOperation transformOperation) {
  if (transformOperation.type == TransformOperationType::Perspective) {
    return Transform::Perspective(transformOperation.x);
  }
  if (transformOperation.type == TransformOperationType::Scale) {
    return Transform::Scale(
        transformOperation.x, transformOperation.y, transformOperation.z);
  }
  if (transformOperation.type == TransformOperationType::Translate) {
    return Transform::Translate(
        transformOperation.x, transformOperation.y, transformOperation.z);
  }
  if (transformOperation.type == TransformOperationType::Skew) {
    return Transform::Skew(transformOperation.x, transformOperation.y);
  }
  if (transformOperation.type == TransformOperationType::Rotate) {
    return Transform::Rotate(
        transformOperation.x, transformOperation.y, transformOperation.z);
  }

  // Identity or Arbitrary
  return Transform::Identity();
}

TransformOperation Transform::DefaultTransformOperation(
    TransformOperationType type) {
  switch (type) {
    case TransformOperationType::Arbitrary:
      return TransformOperation{TransformOperationType::Arbitrary, 0, 0, 0};
    case TransformOperationType::Perspective:
      return TransformOperation{TransformOperationType::Perspective, 0, 0, 0};
    case TransformOperationType::Scale:
      return TransformOperation{TransformOperationType::Scale, 1, 1, 1};
    case TransformOperationType::Translate:
      return TransformOperation{TransformOperationType::Translate, 0, 0, 0};
    case TransformOperationType::Rotate:
      return TransformOperation{TransformOperationType::Rotate, 0, 0, 0};
    case TransformOperationType::Skew:
      return TransformOperation{TransformOperationType::Skew, 0, 0, 0};
    default:
    case TransformOperationType::Identity:
      return TransformOperation{TransformOperationType::Identity, 0, 0, 0};
  }
}

Transform Transform::Interpolate(
    Float animationProgress,
    Transform const &lhs,
    Transform const &rhs) {
  // Iterate through operations and reconstruct an interpolated resulting
  // transform If at any point we hit an "Arbitrary" Transform, return at that
  // point
  Transform result = Transform::Identity();
  for (size_t i = 0, j = 0;
       i < lhs.operations.size() || j < rhs.operations.size();) {
    bool haveLHS = i < lhs.operations.size();
    bool haveRHS = j < rhs.operations.size();

    if ((haveLHS &&
         lhs.operations[i].type == TransformOperationType::Arbitrary) ||
        (haveRHS &&
         rhs.operations[i].type == TransformOperationType::Arbitrary)) {
      return result;
    }
    if (haveLHS && lhs.operations[i].type == TransformOperationType::Identity) {
      i++;
      continue;
    }
    if (haveRHS && rhs.operations[j].type == TransformOperationType::Identity) {
      j++;
      continue;
    }

    // Here we either set:
    // 1. lhs = next left op, rhs = next right op (when types are identical and
    // both exist)
    // 2. lhs = next left op, rhs = default of type (if types unequal, or rhs
    // doesn't exist)
    // 3. lhs = default of type, rhs = next right op (if types unequal, or rhs
    // doesn't exist) This guarantees that the types of both sides are equal,
    // and that one or both indices moves forward.
    TransformOperationType type =
        (haveLHS ? lhs.operations[i] : rhs.operations[j]).type;
    TransformOperation lhsOp =
        (haveLHS ? lhs.operations[i++]
                 : Transform::DefaultTransformOperation(type));
    TransformOperation rhsOp =
        (haveRHS && rhs.operations[j].type == type
             ? rhs.operations[j++]
             : Transform::DefaultTransformOperation(type));
    ABI47_0_0React_native_assert(type == lhsOp.type);
    ABI47_0_0React_native_assert(type == rhsOp.type);

    result = result *
        Transform::FromTransformOperation(TransformOperation{
            type,
            lhsOp.x + (rhsOp.x - lhsOp.x) * animationProgress,
            lhsOp.y + (rhsOp.y - lhsOp.y) * animationProgress,
            lhsOp.z + (rhsOp.z - lhsOp.z) * animationProgress});
  }

  return result;
}

bool Transform::operator==(Transform const &rhs) const {
  for (auto i = 0; i < 16; i++) {
    if (matrix[i] != rhs.matrix[i]) {
      return false;
    }
  }
  return true;
}

bool Transform::operator!=(Transform const &rhs) const {
  return !(*this == rhs);
}

Transform Transform::operator*(Transform const &rhs) const {
  if (*this == Transform::Identity()) {
    return rhs;
  }

  const auto &lhs = *this;
  auto result = Transform{};
  for (const auto &op : this->operations) {
    if (op.type == TransformOperationType::Identity &&
        result.operations.size() > 0) {
      continue;
    }
    result.operations.push_back(op);
  }
  for (const auto &op : rhs.operations) {
    if (op.type == TransformOperationType::Identity &&
        result.operations.size() > 0) {
      continue;
    }
    result.operations.push_back(op);
  }

  auto lhs00 = lhs.matrix[0], lhs01 = lhs.matrix[1], lhs02 = lhs.matrix[2],
       lhs03 = lhs.matrix[3], lhs10 = lhs.matrix[4], lhs11 = lhs.matrix[5],
       lhs12 = lhs.matrix[6], lhs13 = lhs.matrix[7], lhs20 = lhs.matrix[8],
       lhs21 = lhs.matrix[9], lhs22 = lhs.matrix[10], lhs23 = lhs.matrix[11],
       lhs30 = lhs.matrix[12], lhs31 = lhs.matrix[13], lhs32 = lhs.matrix[14],
       lhs33 = lhs.matrix[15];

  auto rhs0 = rhs.matrix[0], rhs1 = rhs.matrix[1], rhs2 = rhs.matrix[2],
       rhs3 = rhs.matrix[3];
  result.matrix[0] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[1] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[2] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[3] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[4];
  rhs1 = rhs.matrix[5];
  rhs2 = rhs.matrix[6];
  rhs3 = rhs.matrix[7];
  result.matrix[4] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[5] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[6] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[7] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[8];
  rhs1 = rhs.matrix[9];
  rhs2 = rhs.matrix[10];
  rhs3 = rhs.matrix[11];
  result.matrix[8] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[9] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[10] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[11] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  rhs0 = rhs.matrix[12];
  rhs1 = rhs.matrix[13];
  rhs2 = rhs.matrix[14];
  rhs3 = rhs.matrix[15];
  result.matrix[12] = rhs0 * lhs00 + rhs1 * lhs10 + rhs2 * lhs20 + rhs3 * lhs30;
  result.matrix[13] = rhs0 * lhs01 + rhs1 * lhs11 + rhs2 * lhs21 + rhs3 * lhs31;
  result.matrix[14] = rhs0 * lhs02 + rhs1 * lhs12 + rhs2 * lhs22 + rhs3 * lhs32;
  result.matrix[15] = rhs0 * lhs03 + rhs1 * lhs13 + rhs2 * lhs23 + rhs3 * lhs33;

  return result;
}

Float &Transform::at(int i, int j) {
  return matrix[(i * 4) + j];
}

Float const &Transform::at(int i, int j) const {
  return matrix[(i * 4) + j];
}

Point operator*(Point const &point, Transform const &transform) {
  if (transform == Transform::Identity()) {
    return point;
  }

  auto result = transform * Vector{point.x, point.y, 0, 1};

  return {result.x, result.y};
}

Rect operator*(Rect const &rect, Transform const &transform) {
  auto centre = rect.getCenter();

  auto a = Point{rect.origin.x, rect.origin.y} - centre;
  auto b = Point{rect.getMaxX(), rect.origin.y} - centre;
  auto c = Point{rect.getMaxX(), rect.getMaxY()} - centre;
  auto d = Point{rect.origin.x, rect.getMaxY()} - centre;

  auto vectorA = transform * Vector{a.x, a.y, 0, 1};
  auto vectorB = transform * Vector{b.x, b.y, 0, 1};
  auto vectorC = transform * Vector{c.x, c.y, 0, 1};
  auto vectorD = transform * Vector{d.x, d.y, 0, 1};

  Point transformedA{vectorA.x + centre.x, vectorA.y + centre.y};
  Point transformedB{vectorB.x + centre.x, vectorB.y + centre.y};
  Point transformedC{vectorC.x + centre.x, vectorC.y + centre.y};
  Point transformedD{vectorD.x + centre.x, vectorD.y + centre.y};

  return Rect::boundingRect(
      transformedA, transformedB, transformedC, transformedD);
}

EdgeInsets operator*(EdgeInsets const &edgeInsets, Transform const &transform) {
  return EdgeInsets{
      edgeInsets.left * transform.matrix[0],
      edgeInsets.top * transform.matrix[5],
      edgeInsets.right * transform.matrix[0],
      edgeInsets.bottom * transform.matrix[5]};
}

Vector operator*(Transform const &transform, Vector const &vector) {
  return {
      vector.x * transform.at(0, 0) + vector.y * transform.at(1, 0) +
          vector.z * transform.at(2, 0) + vector.w * transform.at(3, 0),
      vector.x * transform.at(0, 1) + vector.y * transform.at(1, 1) +
          vector.z * transform.at(2, 1) + vector.w * transform.at(3, 1),
      vector.x * transform.at(0, 2) + vector.y * transform.at(1, 2) +
          vector.z * transform.at(2, 2) + vector.w * transform.at(3, 2),
      vector.x * transform.at(0, 3) + vector.y * transform.at(1, 3) +
          vector.z * transform.at(2, 3) + vector.w * transform.at(3, 3),
  };
}

Size operator*(Size const &size, Transform const &transform) {
  if (transform == Transform::Identity()) {
    return size;
  }

  auto result = Size{};
  result.width = transform.at(0, 0) * size.width;
  result.height = transform.at(1, 1) * size.height;

  return result;
}

} // namespace ABI47_0_0React
} // namespace ABI47_0_0facebook
