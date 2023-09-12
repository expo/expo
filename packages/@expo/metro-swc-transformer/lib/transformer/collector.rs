/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use swc::atoms::js_word;
use swc::atoms::JsWordStaticSet;
use swc_common::errors::HANDLER;
use swc_common::Mark;
use swc_common::DUMMY_SP;
use swc_ecma_utils::swc_ecma_ast::*;
use swc_ecma_utils::ExprFactory;
use swc_ecma_visit::noop_visit_mut_type;
use swc_ecma_visit::VisitMut;
use swc_ecma_visit::VisitMutWith;

use super::module_api::FactoryParams;
use crate::api::Dependency;
use crate::api::DependencyMap;

pub struct DependencyCollector<'a> {
  pub unresolved_mark: Mark,
  pub dependencies: &'a mut DependencyMap,
  pub factory_params: &'a FactoryParams,
}

impl DependencyCollector<'_> {
  fn next_dependency_index(&self) -> i32 {
    self.dependencies.len().try_into().unwrap()
  }
}

fn get_require_specifier(call_expr: &CallExpr) -> Option<&string_cache::Atom<JsWordStaticSet>> {
  if let [ExprOrSpread { spread: None, expr }] = call_expr.args.as_slice() {
    if let Expr::Lit(Lit::Str(Str { value, .. })) = expr.as_ref() {
      Some(value)
    } else {
      None
    }
  } else {
    None
  }
}

fn is_require_call(call_expr: &CallExpr, unresolved_mark: Mark) -> bool {
  if let Callee::Expr(callee_box) = &call_expr.callee {
    if let Expr::Ident(
      ident @ Ident {
        sym: js_word!("require"),
        span: _,
        optional: _,
      },
    ) = &**callee_box
    {
      ident.span.ctxt.has_mark(unresolved_mark)
    } else {
      false
    }
  } else {
    false
  }
}

impl VisitMut for DependencyCollector<'_> {
  noop_visit_mut_type!();

  fn visit_mut_module_item(&mut self, module_item: &mut ModuleItem) {
    // TODO: Handle `import` etc here
    module_item.visit_mut_children_with(self);
  }

  fn visit_mut_call_expr(&mut self, call_expr: &mut CallExpr) {
    call_expr.visit_mut_children_with(self);
    if is_require_call(call_expr, self.unresolved_mark) {
      HANDLER.with(|handler| {
        if let Some(specifier) = get_require_specifier(call_expr) {
          let str_key = specifier.to_string();
          let index = match self.dependencies.get(&str_key) {
            Some(existing_dependency) => existing_dependency.index,
            None => {
              let index = self.next_dependency_index();
              let new_dependency = Dependency { index };
              self.dependencies.insert(str_key, new_dependency);
              index
            }
          };
          let index_usize = index as usize;
          call_expr.args = vec![Expr::Member(MemberExpr {
            span: DUMMY_SP,
            obj: Box::new(self.factory_params.dependency_map.clone().into()),
            prop: MemberProp::Computed(ComputedPropName {
              span: DUMMY_SP,
              expr: Box::new(Expr::Lit(index_usize.into())),
            }),
          })
          .as_arg()];
        } else {
          handler
            .struct_span_err(
              call_expr.span,
              "Not a statically analyzable `require()` call",
            )
            .emit();
        }
      });
    }
  }
}
