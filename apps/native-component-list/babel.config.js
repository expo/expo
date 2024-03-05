const { codeFrameColumns } = require('@babel/code-frame');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

module.exports = function (api) {
  const projectRoot = api.caller((caller) => caller && caller.projectRoot);
  const isNodeModule = api.caller((caller) => caller && caller.isNodeModule);
  // api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    // overrides: [
    //   {
    //     test: /\.tsx$/,
    //     plugins: [
    //       ["babel-plugin-react-forget", {enableUseMemoCachePolyfill: true}],
    //     ],
    //   },
    // ],

    plugins: [
      !isNodeModule && [
        'babel-plugin-react-forget',
        {
          enableUseMemoCachePolyfill: true,
          compilationMode: 'infer',
          panicThreshold: 'NONE',
          logger: {
            logEvent: (filename, event) => {
              let relativeFilename = projectRoot ? path.relative(projectRoot, filename) : filename;

              if (event.kind === 'CompileError') {
                // e.g. (BuildHIR::lowerStatement) Handle var kinds in VariableDeclaration
                if (event.detail.severity === 'Todo') {
                  return;
                }
                // "InvalidJS",
                // "InvalidReact",
                // "InvalidConfig",
                // "Todo",
                // "Invariant"

                const icon = `[${event.detail.severity}]`;
                const pathWithPrefix = chalk`${icon} {dim ${relativeFilename}}`;
                console.log(
                  pathWithPrefix +
                    '\n\n' +
                    codeFrameColumns(fs.readFileSync(filename, 'utf8'), event.detail.loc, {
                      forceColor: true,
                      message: event.detail.reason,
                    })
                );
                // console.log(filename, event);
              } else if (event.kind === 'CompileSuccess') {
                if (event.memoSlots > 0 || event.memoBlocks > 0) {
                  console.log(
                    // NOTE: fnName won't be defined if the function is anonymous or an arrow function.
                    chalk`✅ Optimized {bold ${
                      event.fnName ?? '[anonymous]'
                    }} {dim (${relativeFilename}:${event.fnLoc.start.line}:${
                      event.fnLoc.start.column
                    })}`
                  );
                }
                // console.log(event);
              } else {
                console.log(filename, event);
              }
            },
          },
        },
      ],
    ].filter(Boolean),
  };
};
