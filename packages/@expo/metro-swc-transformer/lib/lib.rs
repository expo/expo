/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#[macro_use]
extern crate napi_derive;

mod api;
mod transformer;

use api::{MetroJSTransformerInput, MetroJSTransformerResult};

#[napi]
pub fn transform(input: MetroJSTransformerInput) -> MetroJSTransformerResult {
  transformer::transform(input).expect("transform error")
}
