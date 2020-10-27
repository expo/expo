/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include <folly/json_patch.h>

#include <glog/logging.h>

#include <folly/container/Enumerate.h>

namespace {
using folly::StringPiece;
// JSON patch operation names
constexpr StringPiece kOperationTest = "test";
constexpr StringPiece kOperationRemove = "remove";
constexpr StringPiece kOperationAdd = "add";
constexpr StringPiece kOperationReplace = "replace";
constexpr StringPiece kOperationMove = "move";
constexpr StringPiece kOperationCopy = "copy";
// field tags in JSON patch
constexpr StringPiece kOpTag = "op";
constexpr StringPiece kValueTag = "value";
constexpr StringPiece kPathTag = "path";
constexpr StringPiece kFromTag = "from";
} // namespace

namespace folly {

// static
Expected<json_patch, json_patch::parse_error> json_patch::try_parse(
    dynamic const& obj) noexcept {
  using err_code = parse_error_code;

  json_patch patch;
  if (!obj.isArray()) {
    return makeUnexpected(parse_error{err_code::invalid_shape, &obj});
  }
  for (auto const& elem : obj) {
    if (!elem.isObject()) {
      return makeUnexpected(parse_error{err_code::invalid_shape, &elem});
    }
    auto const* op_ptr = elem.get_ptr(kOpTag);
    if (!op_ptr) {
      return makeUnexpected(parse_error{err_code::missing_op, &elem});
    }
    if (!op_ptr->isString()) {
      return makeUnexpected(parse_error{err_code::malformed_op, &elem});
    }
    auto const op_str = op_ptr->asString();
    patch_operation op;

    // extract 'from' attribute
    {
      auto const* from_ptr = elem.get_ptr(kFromTag);
      if (from_ptr) {
        if (!from_ptr->isString()) {
          return makeUnexpected(parse_error{err_code::invalid_shape, &elem});
        }
        auto json_ptr = json_pointer::try_parse(from_ptr->asString());
        if (!json_ptr.hasValue()) {
          return makeUnexpected(
              parse_error{err_code::malformed_from_attr, &elem});
        }
        op.from = json_ptr.value();
      }
    }

    // extract 'path' attribute
    {
      auto const* path_ptr = elem.get_ptr(kPathTag);
      if (!path_ptr) {
        return makeUnexpected(parse_error{err_code::missing_path_attr, &elem});
      }
      if (!path_ptr->isString()) {
        return makeUnexpected(
            parse_error{err_code::malformed_path_attr, &elem});
      }
      auto const json_ptr = json_pointer::try_parse(path_ptr->asString());
      if (!json_ptr.hasValue()) {
        return makeUnexpected(
            parse_error{err_code::malformed_path_attr, &elem});
      }
      op.path = json_ptr.value();
    }

    // extract 'value' attribute
    {
      auto const* val_ptr = elem.get_ptr(kValueTag);
      if (val_ptr) {
        op.value = *val_ptr;
      }
    }

    // check mandatory attributes - different per operation
    // NOTE: per RFC, the surplus attributes (e.g. 'from' with 'add')
    // should be simply ignored

    using op_code = patch_operation_code;

    if (op_str == kOperationTest) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::test;
    } else if (op_str == kOperationRemove) {
      op.op_code = op_code::remove;
    } else if (op_str == kOperationAdd) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::add;
    } else if (op_str == kOperationReplace) {
      if (!op.value) {
        return makeUnexpected(parse_error{err_code::missing_value_attr, &elem});
      }
      op.op_code = op_code::replace;
    } else if (op_str == kOperationMove) {
      if (!op.from) {
        return makeUnexpected(parse_error{err_code::missing_from_attr, &elem});
      }
      // is from a proper prefix to path?
      if (op.from->is_prefix_of(op.path)) {
        return makeUnexpected(
            parse_error{err_code::overlapping_pointers, &elem});
      }
      op.op_code = op_code::move;
    } else if (op_str == kOperationCopy) {
      if (!op.from) {
        return makeUnexpected(parse_error{err_code::missing_from_attr, &elem});
      }
      op.op_code = op_code::copy;
    }

    if (op.op_code != op_code::invalid) {
      patch.ops_.emplace_back(std::move(op));
    } else {
      return makeUnexpected(parse_error{err_code::unknown_op, &elem});
    }
  }
  return patch;
}

std::vector<json_patch::patch_operation> const& json_patch::ops() const {
  return ops_;
}

namespace {
// clang-format off
Expected<Unit, json_patch::patch_application_error_code>
// clang-format on
do_remove(dynamic::resolved_json_pointer<dynamic>& ptr) {
  using error_code = json_patch::patch_application_error_code;

  if (!ptr.hasValue()) {
    return folly::makeUnexpected(error_code::path_not_found);
  }

  auto parent = ptr->parent;

  if (!parent) {
    return folly::makeUnexpected(error_code::other);
  }

  if (parent->isObject()) {
    parent->erase(ptr->parent_key);
    return unit;
  }

  if (parent->isArray()) {
    parent->erase(parent->begin() + ptr->parent_index);
    return unit;
  }

  return folly::makeUnexpected(error_code::other);
}

// clang-format off
Expected<Unit, json_patch::patch_application_error_code>
// clang-format on
do_add(
    dynamic::resolved_json_pointer<dynamic>& ptr,
    const dynamic& value,
    const std::string& last_token) {
  using app_err_code = json_patch::patch_application_error_code;
  using res_err_code = dynamic::json_pointer_resolution_error_code;

  // element found: see if parent is object or array
  if (ptr.hasValue()) {
    // root element, or key in object - replace (per RFC)
    if (ptr->parent == nullptr || ptr->parent->isObject()) {
      *ptr->value = value;
    }
    // valid index in array: insert at index and shift right
    if (ptr->parent && ptr->parent->isArray()) {
      ptr->parent->insert(ptr->parent->begin() + ptr->parent_index, value);
    }
  } else {
    // see if we can add value, based on pointer resolution state
    switch (ptr.error().error_code) {
      // key not found. can only happen in object - add new key-value
      case res_err_code::key_not_found: {
        DCHECK(ptr.error().context->isObject());
        ptr.error().context->insert(last_token, value);
        break;
      }
      // special '-' index in array - do append operation
      case res_err_code::append_requested: {
        DCHECK(ptr.error().context->isArray());
        ptr.error().context->push_back(value);
        break;
      }
      case res_err_code::other:
      case res_err_code::index_out_of_bounds:
      case res_err_code::index_not_numeric:
      case res_err_code::index_has_leading_zero:
      case res_err_code::element_not_object_or_array:
      case res_err_code::json_pointer_out_of_bounds:
      default:
        return folly::makeUnexpected(app_err_code::other);
    }
  }
  return unit;
}
} // namespace

// clang-format off
Expected<Unit, json_patch::patch_application_error>
// clang-format on
json_patch::apply(dynamic& obj) {
  using op_code = patch_operation_code;
  using error_code = patch_application_error_code;
  using error = patch_application_error;

  for (auto it : enumerate(ops_)) {
    auto const index = it.index;
    auto const& op = *it;
    auto resolved_path = obj.try_get_ptr(op.path);

    switch (op.op_code) {
      case op_code::test:
        if (!resolved_path.hasValue()) {
          return folly::makeUnexpected(
              error{error_code::path_not_found, index});
        }
        if (*resolved_path->value != *op.value) {
          return folly::makeUnexpected(error{error_code::test_failed, index});
        }
        break;
      case op_code::remove: {
        auto ret = do_remove(resolved_path);
        if (ret.hasError()) {
          return makeUnexpected(error{ret.error(), index});
        }
        break;
      }
      case op_code::add: {
        DCHECK(op.value.has_value());
        auto ret = do_add(resolved_path, *op.value, op.path.tokens().back());
        if (ret.hasError()) {
          return makeUnexpected(error{ret.error(), index});
        }
        break;
      }
      case op_code::replace: {
        if (resolved_path.hasValue()) {
          *resolved_path->value = *op.value;
        } else {
          return folly::makeUnexpected(
              error{error_code::path_not_found, index});
        }
        break;
      }
      case op_code::move: {
        DCHECK(op.from.has_value());
        auto resolved_from = obj.try_get_ptr(*op.from);
        if (!resolved_from.hasValue()) {
          return makeUnexpected(error{error_code::from_not_found, index});
        }
        {
          auto ret = do_add(
              resolved_path, *resolved_from->value, op.path.tokens().back());
          if (ret.hasError()) {
            return makeUnexpected(error{ret.error(), index});
          }
        }
        {
          auto ret = do_remove(resolved_from);
          if (ret.hasError()) {
            return makeUnexpected(error{ret.error(), index});
          }
        }
        break;
      }
      case op_code::copy: {
        DCHECK(op.from.has_value());
        auto const resolved_from = obj.try_get_ptr(*op.from);
        if (!resolved_from.hasValue()) {
          return makeUnexpected(error{error_code::from_not_found, index});
        }
        {
          DCHECK(!op.path.tokens().empty());
          auto ret = do_add(
              resolved_path, *resolved_from->value, op.path.tokens().back());
          if (ret.hasError()) {
            return makeUnexpected(error{ret.error(), index});
          }
        }
        break;
      }
      case op_code::invalid: {
        DCHECK(false);
        return makeUnexpected(error{error_code::other, index});
      }
    }
  }
  return unit;
}

} // namespace folly
