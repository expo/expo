use swc_core::ecma::{
  ast as swc_ast,
  visit::{AstNodePath, AstParentKind, VisitAstPath},
};

#[derive(Debug)]
pub struct OptionalDependencyCollector<'a> {
  pub optional_dependencies: &'a mut Vec<String>,
}

impl VisitAstPath for OptionalDependencyCollector<'_> {
  fn visit_call_expr<'ast: 'r, 'r>(
    &mut self,
    call_expr: &'r swc_ast::CallExpr,
    ast_path: &mut AstNodePath,
  ) {
    let arg = match call_expr.args.len() {
      0 => return,
      _ => &call_expr.args[0],
    };

    let js_module = match &*arg.expr {
      swc_ast::Expr::Lit(swc_ast::Lit::Str(str_lit)) => str_lit.value.to_string(),
      _ => return,
    };

    // 0th index is ExprCall
    let mut found_parent_block_at = 0;
    // TODO: Add test cases; take 10 is roughly equivalent to the Babel collect.
    for (i, kind) in ast_path.kinds().iter().rev().take(10).enumerate() {
      if found_parent_block_at > 0 {
        if let AstParentKind::TryStmt(_) = kind {
          self.optional_dependencies.push(js_module.clone());
        }
        break;
      }
      if let AstParentKind::BlockStmt(_) = kind {
        found_parent_block_at = i;
      }
    }
  }
}
