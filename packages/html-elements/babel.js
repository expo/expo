const elementToComponent = {
  a: 'A',
  article: 'Article',
  b: 'B',
  br: 'BR',
  caption: 'Caption',
  code: 'Code',
  div: 'Div',
  footer: 'Footer',
  h1: 'H1',
  h2: 'H2',
  pre: 'Pre',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6',
  header: 'Header',
  time: 'Time',
  hr: 'HR',
  i: 'I',
  mark: 'Mark',
  del: 'Del',
  em: 'EM',
  li: 'LI',
  main: 'Main',
  nav: 'Nav',
  p: 'P',
  s: 'S',
  section: 'Section',
  table: 'Table',
  tbody: 'TBody',
  td: 'TD',
  th: 'TH',
  thead: 'THead',
  tr: 'TR',
  ul: 'UL',
  strong: 'Strong',
  span: 'Span',
  aside: 'Aside',
  tfoot: 'TFoot',
  blockquote: 'BlockQuote',
  q: 'Q',

  html: 'Div',
  body: 'Div',

  // TODO: img
  // NOTE: head, meta, link should use some special component in the future.
};

const svgElementToComponent = {
  svg: 'Svg',
  circle: 'Circle',
  clipPath: 'ClipPath',
  ellipse: 'Ellipse',
  g: 'G',
  linearGradient: 'LinearGradient',
  radialGradient: 'RadialGradient',
  line: 'Line',
  path: 'Path',
  pattern: 'Pattern',
  polygon: 'Polygon',
  polyline: 'Polyline',
  rect: 'Rect',
  symbol: 'Symbol',
  text: 'Text',
  textPath: 'TextPath',
  tspan: 'TSpan',
  use: 'Use',
  defs: 'Defs',
  stop: 'Stop',
  mask: 'Mask',
  image: 'Image',
  foreignObject: 'ForeignObject',
};

function getPlatform(caller) {
  return caller && caller.platform;
}

module.exports = ({ types: t, ...api }, { expo }) => {
  const platform = api.caller(getPlatform);

  function replaceElement(path, state) {
    // Not supported in node modules
    if (/\/node_modules\//.test(state.filename)) {
      return;
    }

    const { name } = path.node.openingElement.name;

    if (platform === 'web') {
      if (['html', 'body'].includes(name)) {
        return;
      }
    }

    // Check for SVG elements first
    const svgComponent = svgElementToComponent[name];
    if (svgComponent) {
      const openingElementName = path.get('openingElement.name');
      openingElementName.replaceWith(t.jsxIdentifier(svgComponent));
      if (path.has('closingElement')) {
        const closingElementName = path.get('closingElement.name');
        closingElementName.replaceWith(t.jsxIdentifier(svgComponent));
      }
      state.replacedSvgComponents.add(svgComponent);
      return;
    }

    // Replace element with @expo/html-elements
    const component = elementToComponent[name];
    if (!component) {
      return;
    }
    const prefixedComponent = component;
    const openingElementName = path.get('openingElement.name');
    openingElementName.replaceWith(t.jsxIdentifier(prefixedComponent));
    if (path.has('closingElement')) {
      const closingElementName = path.get('closingElement.name');
      closingElementName.replaceWith(t.jsxIdentifier(prefixedComponent));
    }
    state.replacedComponents.add(prefixedComponent);
  }

  const htmlElementVisitor = {
    JSXElement(path, state) {
      replaceElement(path, state);
      path.traverse(jsxElementVisitor, state);
    },
  };

  const jsxElementVisitor = {
    JSXElement(path, state) {
      replaceElement(path, state);
    },
  };

  const importDeclarationVisitor = {
    ImportDeclaration(path, state) {
      if (path.get('source').isStringLiteral({ value: '@expo/html-elements' })) {
        state.replacedComponents.forEach((component) => {
          if (
            path
              .get('specifiers')
              .some((specifier) => specifier.get('local').isIdentifier({ name: component }))
          ) {
            return;
          }
          path.pushContainer(
            'specifiers',
            t.importSpecifier(t.identifier(component), t.identifier(component))
          );
        });
      }

      if (path.get('source').isStringLiteral({ value: 'react-native-svg' })) {
        state.replacedSvgComponents.forEach((component) => {
          if (
            path
              .get('specifiers')
              .some((specifier) => specifier.get('local').isIdentifier({ name: component }))
          ) {
            return;
          }
          path.pushContainer(
            'specifiers',
            t.importSpecifier(t.identifier(component), t.identifier(component))
          );
        });
      }
    },
  };

  const htmlSource = '@expo/html-elements';
  const svgSource = 'react-native-svg';

  return {
    name: 'Rewrite React DOM to universal Expo elements',
    visitor: {
      Program(path, state) {
        state.replacedComponents = new Set();
        state.replacedSvgComponents = new Set();
        state.unsupportedComponents = new Set();

        path.traverse(htmlElementVisitor, state);

        // If state.replacedComponents is not empty, then ensure `import { ... } from '@expo/html-elements'` is present
        if (state.replacedComponents.size > 0) {
          const importDeclaration = t.importDeclaration([], t.stringLiteral(htmlSource));
          path.unshiftContainer('body', importDeclaration);
        }

        // If state.replacedSvgComponents is not empty, then ensure `import { ... } from 'react-native-svg'` is present
        if (state.replacedSvgComponents.size > 0) {
          const importDeclaration = t.importDeclaration([], t.stringLiteral(svgSource));
          path.unshiftContainer('body', importDeclaration);
        }

        path.traverse(importDeclarationVisitor, state);
      },
    },
  };
};
