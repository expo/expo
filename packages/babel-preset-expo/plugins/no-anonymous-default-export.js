// Borrows from Next.js, modified to work in certain Metro environments (exotic transformer)
// https://github.com/vercel/next.js/blob/canary/packages/next/build/babel/plugins/no-anonymous-default-export.ts

const chalk = require('chalk');

// Anonymous functions cannot be used as React components with React Refresh.
// Ensure your function is named, then refresh the app:
//
// export default function () { /* ... */ }
//
//       ↓ ↓ ↓ ↓ ↓ ↓
//
// export default function Named() { /* ... */ }
//
function logLintWarning(log, title, before, after) {
  log(
    [
      chalk.yellow.bold(title),
      'Ensure your function is named, then refresh the app:',
      '',
      before,
      '',
      chalk.bold('      ↓ ↓ ↓ ↓ ↓ ↓      '),
      '',
      after,
      '',
    ].join('\n')
  );
}

function getLogger(caller) {
  let onWarning;
  caller((caller) => {
    onWarning = caller.onWarning;
    // Prevent updating the cache.
    return '';
  });
  return onWarning;
}

/**
 * Provide a linting warning about React Refresh using anonymous functions.
 *
 * Without this operation, users will notice that their development client will say
 * it was "Fast Refreshed" but no changes will occur.
 *
 */
module.exports = function ({ types, ...babel }) {
  const onWarning = getLogger(babel.caller);
  if (typeof onWarning !== 'function') {
    return { visitor: {} };
  }
  return {
    visitor: {
      ExportDefaultDeclaration({ node: { declaration } }) {
        switch (declaration.type) {
          case 'ArrowFunctionExpression': {
            logLintWarning(
              onWarning,
              'Anonymous arrow functions cannot be used as React components with React Refresh.',
              // export default () => <View />
              chalk.magenta`export default` +
                ' () ' +
                chalk.magenta`=> ` +
                '<' +
                chalk.cyanBright`View` +
                ' />',
              // const Custom = () => <View />
              chalk.magenta`const ` +
                chalk.greenBright`Custom` +
                chalk.magenta` =` +
                ' () ' +
                chalk.magenta`=> ` +
                '<' +
                chalk.cyanBright`View` +
                ' />' +
                '\n' +
                // export default Custom
                chalk.magenta`export default ` +
                chalk.greenBright`Custom`
            );
            break;
          }
          case 'FunctionDeclaration': {
            const isAnonymous = !declaration.id;
            if (isAnonymous) {
              logLintWarning(
                onWarning,
                'Anonymous functions cannot be used as React components with React Refresh.',
                // export default function () { /* ... */ }
                chalk.magenta`export default function ` + '() { ' + chalk.dim`/* ... */ ` + '}',
                // export default function Named() { /* ... */ }
                chalk.magenta`export default function ` +
                  chalk.greenBright`Named` +
                  '() { ' +
                  chalk.dim`/* ... */ ` +
                  '}'
              );
            }
            break;
          }
        }
      },
    },
  };
};
