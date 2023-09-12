/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use std::collections::HashMap;

use serde::Deserialize;
use serde::Serialize;

#[napi(object)]
#[derive(Serialize, Deserialize)]
pub struct MetroJSTransformerInput {
  pub code: String,
  pub file_name: Option<String>,
  pub global_prefix: Option<String>,
}

pub type DependencyMap = HashMap<String, Dependency>;

#[napi(object)]
#[derive(Serialize, Deserialize, Clone)]
pub struct MetroJSTransformerResult {
  pub code: String,
  pub dependencies: DependencyMap,
  pub optional_dependencies: Vec<String>,
  pub dependency_map_ident: String,
}

#[napi(object)]
#[derive(Serialize, Deserialize, Clone)]
pub struct Dependency {
  pub index: i32,
}
