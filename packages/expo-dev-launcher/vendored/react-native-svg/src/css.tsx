import React, { Component, useEffect, useMemo, useState } from 'react';
import {
  camelCase,
  err,
  fetchText,
  JsxAST,
  Middleware,
  parse,
  Styles,
  SvgAst,
  UriProps,
  UriState,
  XmlAST,
  XmlProps,
  XmlState,
} from './xml';
import csstree, {
  Atrule,
  AtrulePrelude,
  CssNode,
  Declaration,
  DeclarationList,
  List,
  ListItem,
  PseudoClassSelector,
  Rule,
  Selector,
  SelectorList,
} from 'css-tree';
import cssSelect, { Adapter, Options, Predicate, Query } from 'css-select';

/*
 * Style element inlining experiment based on SVGO
 * https://github.com/svg/svgo/blob/11f9c797411a8de966aacc4cb83dbb3e471757bc/plugins/inlineStyles.js
 * */

/**
 * DOMUtils API for rnsvg AST (used by css-select)
 */
// is the node a tag?
// isTag: ( node:Node ) => isTag:Boolean
function isTag(node: XmlAST | string): node is XmlAST {
  return typeof node === 'object';
}

// get the parent of the node
// getParent: ( node:Node ) => parentNode:Node
// returns null when no parent exists
function getParent(node: XmlAST | string): XmlAST {
  return ((typeof node === 'object' && node.parent) || null) as XmlAST;
}

// get the node's children
// getChildren: ( node:Node ) => children:[Node]
function getChildren(node: XmlAST | string): Array<XmlAST | string> {
  return (typeof node === 'object' && node.children) || [];
}

// get the name of the tag'
// getName: ( elem:ElementNode ) => tagName:String
function getName(elem: XmlAST): string {
  return elem.tag;
}

// get the text content of the node, and its children if it has any
// getText: ( node:Node ) => text:String
// returns empty string when there is no text
function getText(_node: XmlAST | string): string {
  return '';
}

// get the attribute value
// getAttributeValue: ( elem:ElementNode, name:String ) => value:String
// returns null when attribute doesn't exist
function getAttributeValue(elem: XmlAST, name: string): string {
  return (elem.props[name] || null) as string;
}

// takes an array of nodes, and removes any duplicates, as well as any nodes
// whose ancestors are also in the array
function removeSubsets(nodes: Array<XmlAST | string>): Array<XmlAST | string> {
  let idx = nodes.length,
    node,
    ancestor,
    replace;

  // Check if each node (or one of its ancestors) is already contained in the
  // array.
  while (--idx > -1) {
    node = ancestor = nodes[idx];

    // Temporarily remove the node under consideration
    delete nodes[idx];
    replace = true;

    while (ancestor) {
      if (nodes.includes(ancestor)) {
        replace = false;
        nodes.splice(idx, 1);
        break;
      }
      ancestor = (typeof ancestor === 'object' && ancestor.parent) || null;
    }

    // If the node has been found to be unique, re-insert it.
    if (replace) {
      nodes[idx] = node;
    }
  }

  return nodes;
}

// does at least one of passed element nodes pass the test predicate?
function existsOne(
  predicate: Predicate<XmlAST>,
  elems: Array<XmlAST | string>,
): boolean {
  return elems.some(
    elem =>
      typeof elem === 'object' &&
      (predicate(elem) || existsOne(predicate, elem.children)),
  );
}

/*
  get the siblings of the node. Note that unlike jQuery's `siblings` method,
  this is expected to include the current node as well
*/
function getSiblings(node: XmlAST | string): Array<XmlAST | string> {
  const parent = typeof node === 'object' && node.parent;
  return (parent && parent.children) || [];
}

// does the element have the named attribute?
function hasAttrib(elem: XmlAST, name: string): boolean {
  return elem.props.hasOwnProperty(name);
}

// finds the first node in the array that matches the test predicate, or one
// of its children
function findOne(
  predicate: Predicate<XmlAST>,
  elems: Array<XmlAST | string>,
): XmlAST | undefined {
  let elem: XmlAST | undefined;

  for (let i = 0, l = elems.length; i < l && !elem; i++) {
    const node = elems[i];
    if (typeof node === 'string') {
    } else if (predicate(node)) {
      elem = node;
    } else {
      const { children } = node;
      if (children.length !== 0) {
        elem = findOne(predicate, children);
      }
    }
  }

  return elem;
}

// finds all of the element nodes in the array that match the test predicate,
// as well as any of their children that match it
function findAll(
  predicate: Predicate<XmlAST>,
  nodes: Array<XmlAST | string>,
  result: Array<XmlAST> = [],
): Array<XmlAST> {
  for (let i = 0, j = nodes.length; i < j; i++) {
    const node = nodes[i];
    if (typeof node !== 'object') {
      continue;
    }
    if (predicate(node)) {
      result.push(node);
    }
    const { children } = node;
    if (children.length !== 0) {
      findAll(predicate, children, result);
    }
  }

  return result;
}

const adapter: Adapter<XmlAST | string, XmlAST> = {
  removeSubsets,
  existsOne,
  getSiblings,
  hasAttrib,
  findOne,
  findAll,
  isTag,
  getParent,
  getChildren,
  getName,
  getText,
  getAttributeValue,
};

const cssSelectOpts: Options<XmlAST | string, XmlAST> = {
  xmlMode: true,
  adapter,
};

/**
 * Evaluate a string of CSS selectors against the element and returns matched elements.
 *
 * @param {Query} query can be either a CSS selector string or a compiled query function.
 * @param {Array<XmlAST> | XmlAST} elems Elements to query. If it is an element, its children will be queried.
 * @return {Array<XmlAST>} All matching elements.
 */
function querySelectorAll(query: Query, elems: XmlAST | XmlAST[]): XmlAST[] {
  return cssSelect(query, elems, cssSelectOpts);
}

type FlatPseudoSelector = {
  item: ListItem<CssNode>;
  list: List<CssNode>;
};
type FlatPseudoSelectorList = FlatPseudoSelector[];
type FlatSelector = {
  item: ListItem<CssNode>;
  atrule: Atrule | null;
  rule: CssNode;
  pseudos: FlatPseudoSelectorList;
};
type FlatSelectorList = FlatSelector[];

/**
 * Flatten a CSS AST to a selectors list.
 *
 * @param {Object} cssAst css-tree AST to flatten
 * @param {Array} selectors
 */
function flattenToSelectors(cssAst: CssNode, selectors: FlatSelectorList) {
  csstree.walk(cssAst, {
    visit: 'Rule',
    enter(rule: CssNode) {
      const { type, prelude } = rule as Rule;
      if (type !== 'Rule') {
        return;
      }
      const atrule = this.atrule;
      (prelude as SelectorList).children.each((node, item) => {
        const { children } = node as Selector;
        const pseudos: FlatPseudoSelectorList = [];
        selectors.push({
          item,
          atrule,
          rule,
          pseudos,
        });
        children.each(({ type: childType }, pseudoItem, list) => {
          if (
            childType === 'PseudoClassSelector' ||
            childType === 'PseudoElementSelector'
          ) {
            pseudos.push({
              item: pseudoItem,
              list,
            });
          }
        });
      });
    },
  });
}

/**
 * Filter selectors by Media Query.
 *
 * @param {Array} selectors to filter
 * @return {Array} Filtered selectors that match the passed media queries
 */
function filterByMqs(selectors: FlatSelectorList) {
  return selectors.filter(({ atrule }) => {
    if (atrule === null) {
      return true;
    }
    const { name, prelude } = atrule;
    const atPrelude = prelude as AtrulePrelude;
    const first = atPrelude && atPrelude.children.first();
    const mq = first && first.type === 'MediaQueryList';
    const query = mq ? csstree.generate(atPrelude) : name;
    return useMqs.includes(query);
  });
}
// useMqs Array with strings of media queries that should pass (<name> <expression>)
const useMqs = ['', 'screen'];

/**
 * Filter selectors by the pseudo-elements and/or -classes they contain.
 *
 * @param {Array} selectors to filter
 * @return {Array} Filtered selectors that match the passed pseudo-elements and/or -classes
 */
function filterByPseudos(selectors: FlatSelectorList) {
  return selectors.filter(({ pseudos }) =>
    usePseudos.includes(
      csstree.generate({
        type: 'Selector',
        children: new List<CssNode>().fromArray(
          pseudos.map(pseudo => pseudo.item.data),
        ),
      }),
    ),
  );
}
// usePseudos Array with strings of single or sequence of pseudo-elements and/or -classes that should pass
const usePseudos = [''];

/**
 * Remove pseudo-elements and/or -classes from the selectors for proper matching.
 *
 * @param {Array} selectors to clean
 * @return {Array} Selectors without pseudo-elements and/or -classes
 */
function cleanPseudos(selectors: FlatSelectorList) {
  selectors.forEach(({ pseudos }) =>
    pseudos.forEach(pseudo => pseudo.list.remove(pseudo.item)),
  );
}

type Specificity = [number, number, number];
function specificity(selector: Selector): Specificity {
  let A = 0;
  let B = 0;
  let C = 0;

  selector.children.each(function walk(node: CssNode) {
    switch (node.type) {
      case 'SelectorList':
      case 'Selector':
        node.children.each(walk);
        break;

      case 'IdSelector':
        A++;
        break;

      case 'ClassSelector':
      case 'AttributeSelector':
        B++;
        break;

      case 'PseudoClassSelector':
        switch (node.name.toLowerCase()) {
          case 'not':
            const children = (node as PseudoClassSelector).children;
            children && children.each(walk);
            break;

          case 'before':
          case 'after':
          case 'first-line':
          case 'first-letter':
            C++;
            break;

          // TODO: support for :nth-*(.. of <SelectorList>), :matches(), :has()

          default:
            B++;
        }
        break;

      case 'PseudoElementSelector':
        C++;
        break;

      case 'TypeSelector':
        // ignore universal selector
        const { name } = node;
        if (name.charAt(name.length - 1) !== '*') {
          C++;
        }
        break;
    }
  });

  return [A, B, C];
}

/**
 * Compares two selector specificities.
 * extracted from https://github.com/keeganstreet/specificity/blob/master/specificity.js#L211
 *
 * @param {Array} aSpecificity Specificity of selector A
 * @param {Array} bSpecificity Specificity of selector B
 * @return {Number} Score of selector specificity A compared to selector specificity B
 */
function compareSpecificity(
  aSpecificity: Specificity,
  bSpecificity: Specificity,
): number {
  for (let i = 0; i < 4; i += 1) {
    if (aSpecificity[i] < bSpecificity[i]) {
      return -1;
    } else if (aSpecificity[i] > bSpecificity[i]) {
      return 1;
    }
  }
  return 0;
}

type Spec = {
  selector: FlatSelector;
  specificity: Specificity;
};
function selectorWithSpecificity(selector: FlatSelector): Spec {
  return {
    selector,
    specificity: specificity(selector.item.data as Selector),
  };
}

/**
 * Compare two simple selectors.
 *
 * @param {Object} a Simple selector A
 * @param {Object} b Simple selector B
 * @return {Number} Score of selector A compared to selector B
 */
function bySelectorSpecificity(a: Spec, b: Spec): number {
  return compareSpecificity(a.specificity, b.specificity);
}

// Run a single pass with the given chunk size.
function pass(arr: Spec[], len: number, chk: number, result: Spec[]) {
  // Step size / double chunk size.
  const dbl = chk * 2;
  // Bounds of the left and right chunks.
  let l, r, e;
  // Iterators over the left and right chunk.
  let li, ri;

  // Iterate over pairs of chunks.
  let i = 0;
  for (l = 0; l < len; l += dbl) {
    r = l + chk;
    e = r + chk;
    if (r > len) {
      r = len;
    }
    if (e > len) {
      e = len;
    }

    // Iterate both chunks in parallel.
    li = l;
    ri = r;
    while (true) {
      // Compare the chunks.
      if (li < r && ri < e) {
        // This works for a regular `sort()` compatible comparator,
        // but also for a simple comparator like: `a > b`
        if (bySelectorSpecificity(arr[li], arr[ri]) <= 0) {
          result[i++] = arr[li++];
        } else {
          result[i++] = arr[ri++];
        }
      }
      // Nothing to compare, just flush what's left.
      else if (li < r) {
        result[i++] = arr[li++];
      } else if (ri < e) {
        result[i++] = arr[ri++];
      }
      // Both iterators are at the chunk ends.
      else {
        break;
      }
    }
  }
}

// Execute the sort using the input array and a second buffer as work space.
// Returns one of those two, containing the final result.
function exec(arr: Spec[], len: number): Spec[] {
  // Rather than dividing input, simply iterate chunks of 1, 2, 4, 8, etc.
  // Chunks are the size of the left or right hand in merge sort.
  // Stop when the left-hand covers all of the array.
  let buffer = new Array(len);
  for (let chk = 1; chk < len; chk *= 2) {
    pass(arr, len, chk, buffer);
    const tmp = arr;
    arr = buffer;
    buffer = tmp;
  }
  return arr;
}

/**
 * Sort selectors stably by their specificity.
 *
 * @param {Array} selectors to be sorted
 * @return {Array} Stable sorted selectors
 */
function sortSelectors(selectors: FlatSelectorList) {
  // Short-circuit when there's nothing to sort.
  const len = selectors.length;
  if (len <= 1) {
    return selectors;
  }
  const specs = selectors.map(selectorWithSpecificity);
  return exec(specs, len).map(s => s.selector);
}

const declarationParseProps = {
  context: 'declarationList',
  parseValue: false,
};
function CSSStyleDeclaration(ast: XmlAST) {
  const { props, styles } = ast;
  if (!props.style) {
    props.style = {};
  }
  const style = props.style as Styles;
  const priority = new Map();
  ast.style = style;
  ast.priority = priority;
  if (!styles || styles.length === 0) {
    return;
  }
  try {
    const declarations = csstree.parse(
      styles,
      declarationParseProps,
    ) as DeclarationList;
    declarations.children.each(node => {
      try {
        const { property, value, important } = node as Declaration;
        const name = property.trim();
        priority.set(name, important);
        style[camelCase(name)] = csstree.generate(value).trim();
      } catch (styleError) {
        if (styleError.message !== 'Unknown node type: undefined') {
          console.warn(
            "Warning: Parse error when parsing inline styles, style properties of this element cannot be used. The raw styles can still be get/set using .attr('style').value. Error details: " +
              styleError,
          );
        }
      }
    });
  } catch (parseError) {
    console.warn(
      "Warning: Parse error when parsing inline styles, style properties of this element cannot be used. The raw styles can still be get/set using .attr('style').value. Error details: " +
        parseError,
    );
  }
}

interface StyledAST extends XmlAST {
  style: Styles;
  priority: Map<string, boolean | undefined>;
}
function initStyle(selectedEl: XmlAST): StyledAST {
  if (!selectedEl.style) {
    CSSStyleDeclaration(selectedEl);
  }
  return selectedEl as StyledAST;
}

/**
 * Find the closest ancestor of the current element.
 * @param node
 * @param elemName
 * @return {?Object}
 */
function closestElem(node: XmlAST, elemName: string) {
  let elem: XmlAST | null = node;
  while ((elem = elem.parent) && elem.tag !== elemName) {}
  return elem;
}

const parseProps = {
  parseValue: false,
  parseCustomProperty: false,
};

/**
 * Moves + merges styles from style elements to element styles
 *
 * Options
 *   useMqs (default: ['', 'screen'])
 *     what media queries to be used
 *     empty string element for styles outside media queries
 *
 *   usePseudos (default: [''])
 *     what pseudo-classes/-elements to be used
 *     empty string element for all non-pseudo-classes and/or -elements
 *
 * @param {Object} document document element
 *
 * @author strarsis <strarsis@gmail.com>
 * @author modified by: msand <msand@abo.fi>
 */
export const inlineStyles: Middleware = function inlineStyles(
  document: XmlAST,
) {
  // collect <style/>s
  const styleElements = querySelectorAll('style', document);

  //no <styles/>s, nothing to do
  if (styleElements.length === 0) {
    return document;
  }

  const selectors: FlatSelectorList = [];

  for (let element of styleElements) {
    const { children } = element;
    if (!children.length || closestElem(element, 'foreignObject')) {
      // skip empty <style/>s or <foreignObject> content.
      continue;
    }

    // collect <style/>s and their css ast
    try {
      const styleString = children.join('');
      flattenToSelectors(csstree.parse(styleString, parseProps), selectors);
    } catch (parseError) {
      console.warn(
        'Warning: Parse error of styles of <style/> element, skipped. Error details: ' +
          parseError,
      );
    }
  }

  // filter for mediaqueries to be used or without any mediaquery
  const selectorsMq = filterByMqs(selectors);

  // filter for pseudo elements to be used
  const selectorsPseudo = filterByPseudos(selectorsMq);

  // remove PseudoClass from its SimpleSelector for proper matching
  cleanPseudos(selectorsPseudo);

  // stable sort selectors
  const sortedSelectors = sortSelectors(selectorsPseudo).reverse();

  // match selectors
  for (let { rule, item } of sortedSelectors) {
    if (rule === null) {
      continue;
    }
    const selectorStr = csstree.generate(item.data);
    try {
      // apply <style/> to matched elements
      const matched = querySelectorAll(selectorStr, document).map(initStyle);
      if (matched.length === 0) {
        continue;
      }
      csstree.walk(rule, {
        visit: 'Declaration',
        enter(node: CssNode) {
          const { property, value, important } = node as Declaration;
          // existing inline styles have higher priority
          // no inline styles, external styles,                                    external styles used
          // inline styles,    external styles same   priority as inline styles,   inline   styles used
          // inline styles,    external styles higher priority than inline styles, external styles used
          const name = property.trim();
          const camel = camelCase(name);
          const val = csstree.generate(value).trim();
          for (let element of matched) {
            const { style, priority } = element;
            const current = priority.get(name);
            if (current === undefined || current < important) {
              priority.set(name, important as boolean);
              style[camel] = val;
            }
          }
        },
      });
    } catch (selectError) {
      if (selectError.constructor === SyntaxError) {
        console.warn(
          'Warning: Syntax error when trying to select \n\n' +
            selectorStr +
            '\n\n, skipped. Error details: ' +
            selectError,
        );
        continue;
      }
      throw selectError;
    }
  }

  return document;
};

export function SvgCss(props: XmlProps) {
  const { xml, override } = props;
  const ast = useMemo<JsxAST | null>(
    () => (xml !== null ? parse(xml, inlineStyles) : null),
    [xml],
  );
  return <SvgAst ast={ast} override={override || props} />;
}

export function SvgCssUri(props: UriProps) {
  const { uri } = props;
  const [xml, setXml] = useState<string | null>(null);
  useEffect(() => {
    uri
      ? fetchText(uri)
          .then(setXml)
          .catch(err)
      : setXml(null);
  }, [uri]);
  return <SvgCss xml={xml} override={props} />;
}

// Extending Component is required for Animated support.

export class SvgWithCss extends Component<XmlProps, XmlState> {
  state = { ast: null };
  componentDidMount() {
    this.parse(this.props.xml);
  }
  componentDidUpdate(prevProps: { xml: string | null }) {
    const { xml } = this.props;
    if (xml !== prevProps.xml) {
      this.parse(xml);
    }
  }
  parse(xml: string | null) {
    try {
      this.setState({ ast: xml ? parse(xml, inlineStyles) : null });
    } catch (e) {
      console.error(e);
    }
  }
  render() {
    const {
      props,
      state: { ast },
    } = this;
    return <SvgAst ast={ast} override={props.override || props} />;
  }
}

export class SvgWithCssUri extends Component<UriProps, UriState> {
  state = { xml: null };
  componentDidMount() {
    this.fetch(this.props.uri);
  }
  componentDidUpdate(prevProps: { uri: string | null }) {
    const { uri } = this.props;
    if (uri !== prevProps.uri) {
      this.fetch(uri);
    }
  }
  async fetch(uri: string | null) {
    try {
      this.setState({ xml: uri ? await fetchText(uri) : null });
    } catch (e) {
      console.error(e);
    }
  }
  render() {
    const {
      props,
      state: { xml },
    } = this;
    return <SvgWithCss xml={xml} override={props} />;
  }
}
