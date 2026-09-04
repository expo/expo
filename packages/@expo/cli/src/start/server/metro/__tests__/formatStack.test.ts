import { formatStack } from '../formatStack';
import type { StackFrame } from '../log-box/LogBoxSymbolication';

jest.mock('chalk', () => {
  const format = (value: unknown, substitutions: unknown[]) => {
    if (!Array.isArray(value)) {
      return String(value);
    }
    return value.reduce((output, part, index) => output + part + (substitutions[index] ?? ''), '');
  };
  const style =
    (name: string) =>
    (value: unknown, ...substitutions: unknown[]) =>
      `<${name}>${format(value, substitutions)}</${name}>`;

  return {
    __esModule: true,
    default: {
      bold: style('bold'),
      dim: style('dim'),
      gray: style('gray'),
      reset: style('reset'),
    },
  };
});

jest.mock('terminal-link', () => {
  const terminalLink = (text: string) => text;
  terminalLink.isSupported = false;
  return { __esModule: true, default: terminalLink };
});

const projectRoot = '/app';

function createFrame({
  file,
  methodName,
  collapse = false,
}: {
  file: string;
  methodName: string;
  collapse?: boolean;
}): StackFrame {
  return {
    arguments: [],
    column: 2,
    file,
    lineNumber: 10,
    methodName,
    collapse,
  };
}

it('formats a general call stack', () => {
  expect(
    formatStack(projectRoot, {
      stack: [createFrame({ file: '/app/App.tsx', methodName: 'renderApp' })],
      showCollapsedFrames: false,
    })
  ).toEqual({
    isFallback: false,
    stack: ['<bold>Call Stack</bold>', '<gray>  renderApp (App.tsx:10:3)</gray>'].join('\n'),
  });
});

it('dims external frames and only shows collapsed external frames when requested', () => {
  const stack = [
    createFrame({ file: '/app/App.tsx', methodName: 'renderApp' }),
    createFrame({
      file: '/app/node_modules/external-package/index.js',
      methodName: 'externalOnly',
    }),
    createFrame({
      file: '/app/node_modules/react-refresh/runtime.js',
      methodName: 'externalAndCollapsed',
      collapse: true,
    }),
  ];

  expect(formatStack(projectRoot, { stack, showCollapsedFrames: false }).stack).toBe(
    [
      '<bold>Call Stack</bold>',
      '<gray>  renderApp (App.tsx:10:3)</gray>',
      '<dim><gray>  externalOnly (node_modules/external-package/index.js:10:3)</gray></dim>',
    ].join('\n')
  );

  expect(formatStack(projectRoot, { stack, showCollapsedFrames: true }).stack).toBe(
    [
      '<bold>Call Stack</bold>',
      '<gray>  renderApp (App.tsx:10:3)</gray>',
      '<dim><gray>  externalOnly (node_modules/external-package/index.js:10:3)</gray></dim>',
      '<dim><gray>  externalAndCollapsed (node_modules/react-refresh/runtime.js:10:3)</gray></dim>',
    ].join('\n')
  );
});
