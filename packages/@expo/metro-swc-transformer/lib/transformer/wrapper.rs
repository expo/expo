/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

use swc_common::errors::HANDLER;
use swc_common::Mark;
use swc_common::DUMMY_SP;
use swc_ecma_utils::quote_ident;
use swc_ecma_utils::swc_ecma_ast::*;
use swc_ecma_utils::ExprFactory;
use swc_ecma_utils::FunctionFactory;
use swc_ecma_visit::noop_fold_type;
use swc_ecma_visit::Fold;

use super::module_api::FactoryParams;

pub struct ModuleWrapper<'a> {
  pub global_prefix: String,
  pub unresolved_mark: Mark,
  pub factory_params: &'a FactoryParams,
}

impl ModuleWrapper<'_> {
  fn get_factory_fn_expr(&self, body_stmts: Vec<Stmt>) -> Expr {
    Function {
      params: vec![
        self.factory_params.global.clone().into(),
        self.factory_params.require.clone().into(),
        self.factory_params.import_default.clone().into(),
        self.factory_params.import_all.clone().into(),
        self.factory_params.module.clone().into(),
        self.factory_params.exports.clone().into(),
        self.factory_params.dependency_map.clone().into(),
      ],
      decorators: Default::default(),
      span: DUMMY_SP,
      body: Some(BlockStmt {
        span: DUMMY_SP,
        stmts: body_stmts,
      }),
      is_generator: false,
      is_async: false,
      type_params: None,
      return_type: None,
    }
    .into_fn_expr(None)
    .into()
  }

  fn get_define_call_stmt(&self, body_stmts: Vec<Stmt>) -> Stmt {
    Stmt::Expr(ExprStmt {
      span: DUMMY_SP,
      expr: Box::new(Expr::Call(CallExpr {
        span: DUMMY_SP,
        callee: quote_ident!(self.global_prefix.clone() + "__d").as_callee(),
        args: vec![self.get_factory_fn_expr(body_stmts).as_arg()],
        type_args: None,
      })),
    })
  }
}

impl Fold for ModuleWrapper<'_> {
  noop_fold_type!();

  fn fold_script(&mut self, script: Script) -> Script {
    Script {
      body: vec![self.get_define_call_stmt(script.body)],
      ..script
    }
  }

  fn fold_module(&mut self, module: Module) -> Module {
    let stmts: Vec<Stmt> = module
      .body
      .clone()
      .into_iter()
      .filter_map(|item| match item {
        ModuleItem::ModuleDecl(_) => {
          HANDLER.with(|handler| {
            handler.bug("Module declaration not lowered, cannot wrap in a function");
          });
          None
        }
        ModuleItem::Stmt(stmt) => Some(stmt),
      })
      .collect();
    Module {
      body: vec![ModuleItem::Stmt(self.get_define_call_stmt(stmts))],
      ..module
    }
  }
}
