/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

mod collector;
mod collector_optional;
mod module_api;
mod options;
mod wrapper;

use std::path::PathBuf;
use std::sync::Arc;

use module_api::FactoryParams;
use swc::Compiler;
use swc_common::chain;
use swc_common::comments::SingleThreadedComments;
use swc_common::errors::ColorConfig;
use swc_common::errors::Handler;
use swc_common::FileName;
use swc_common::Globals;
use swc_common::Mark;
use swc_common::SourceMap;
use swc_common::GLOBALS;
use swc_ecma_transforms_base::hygiene::hygiene;
use swc_ecma_transforms_base::pass::noop;
use swc_ecma_transforms_base::resolver;
use swc_ecma_visit::as_folder;
use swc_ecma_visit::VisitWithPath;

use crate::api::*;
use crate::transformer::collector::DependencyCollector;
use crate::transformer::collector_optional::OptionalDependencyCollector;
use crate::transformer::options::get_config_options;
use crate::transformer::wrapper::ModuleWrapper;

pub fn transform(input: MetroJSTransformerInput) -> Result<MetroJSTransformerResult, &'static str> {
  let is_typescript = input.file_name.clone().unwrap().ends_with(".ts")
    || input.file_name.clone().unwrap().ends_with(".tsx");
  let cm = Arc::<SourceMap>::default();
  let compiler = Compiler::new(cm.clone());
  let handler = Arc::new(Handler::with_tty_emitter(
    ColorConfig::Auto,
    true,
    false,
    Some(cm.clone()),
  ));
  let globals = Globals::new();

  let mut result: Result<MetroJSTransformerResult, &'static str> = Err("Uninitialized");
  GLOBALS.set(&globals, || {
    let unresolved_mark = Mark::fresh(Mark::root());
    let mut dependencies = DependencyMap::new();
    let mut optional_dependencies: Vec<String> = vec![];
    let factory_params = FactoryParams::new(unresolved_mark);
    let MetroJSTransformerInput {
      code,
      global_prefix,
      file_name,
    } = input;
    let fm = cm.new_source_file(
      file_name.map_or(FileName::Anon, |file_name| {
        FileName::Real(PathBuf::from(file_name))
      }),
      code.into(),
    );
    let global_mark = Mark::fresh(Mark::root());
    let options = get_config_options(is_typescript);
    let program = compiler
      .parse_js(
        fm.clone(),
        &handler,
        options.config.jsc.target.unwrap(),
        options.config.jsc.syntax.unwrap(),
        swc::config::IsModule::Bool(true), // is_module
        None,
      )
      .unwrap();
    let mut optional_dependencies_collector = OptionalDependencyCollector {
      optional_dependencies: &mut optional_dependencies,
    };
    program.visit_with_path(
      &mut optional_dependencies_collector,
      &mut Default::default(),
    );
    let output = compiler.process_js_with_custom_pass(
      fm.clone(),
      Some(program),
      &handler,
      &options,
      SingleThreadedComments::default(),
      |_| noop(),
      |_| {
        chain!(
          resolver(
            unresolved_mark,
            global_mark,
            options
              .config
              .jsc
              .syntax
              .map_or(false, |syntax| syntax.typescript())
          ),
          as_folder(DependencyCollector {
            factory_params: &factory_params,
            unresolved_mark,
            dependencies: &mut dependencies,
          }),
          ModuleWrapper {
            factory_params: &factory_params,
            unresolved_mark,
            global_prefix: global_prefix.unwrap_or_default(),
          },
          // TODO: Can we avoid this second hygiene pass? (And perhaps the first one built into swc?)
          // Its purpose here is to prevent collisions with the `dependencyMap` identifier.
          hygiene(),
        )
      },
    );
    result = if let Ok(out) = output {
      if handler.has_errors() {
        // TODO: Include diagnostics from `handler`
        Err("Had compilation errors")
      } else {
        Ok(MetroJSTransformerResult {
          code: out.code,
          dependencies,
          optional_dependencies,
          dependency_map_ident: factory_params.dependency_map.sym.to_string(),
        })
      }
    } else {
      Err("Had compilation errors")
    }
  });
  result
}
