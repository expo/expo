/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use swc_common::Mark;
use swc_common::DUMMY_SP;
use swc_ecma_utils::private_ident;
use swc_ecma_utils::quote_ident;
use swc_ecma_visit::swc_ecma_ast::Ident;

pub struct FactoryParams {
  pub global: Ident,
  pub require: Ident,
  pub import_default: Ident,
  pub import_all: Ident,
  pub module: Ident,
  pub exports: Ident,
  pub dependency_map: Ident,
}

impl FactoryParams {
  pub fn new(unresolved_mark: Mark) -> FactoryParams {
    FactoryParams {
      // Unresolved idents are safe against renaming during the hygiene
      // pass - this is important because the wrapped code may reference
      // them. Others are private and effectively invisible to user code.
      global: quote_ident!(DUMMY_SP.apply_mark(unresolved_mark), "global"),
      require: quote_ident!(DUMMY_SP.apply_mark(unresolved_mark), "require"),
      import_default: private_ident!("importDefault"),
      import_all: private_ident!("importAll"),
      module: quote_ident!(DUMMY_SP.apply_mark(unresolved_mark), "module"),
      exports: quote_ident!(DUMMY_SP.apply_mark(unresolved_mark), "exports"),
      dependency_map: private_ident!("dependencyMap"),
    }
  }
}
