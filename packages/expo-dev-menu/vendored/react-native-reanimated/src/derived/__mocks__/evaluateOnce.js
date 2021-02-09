import { always } from '../../base';
export function evaluateOnce(node, children = [], callback) {
  if (!Array.isArray(children)) {
    children = [children];
  }
  const alwaysNode = always(node);
  for (let i = 0; i < children.length; i++) {
    alwaysNode.__addChild(children[i]);
  }
  for (let i = 0; i < children.length; i++) {
    alwaysNode.__removeChild(children[i]);
  }
  callback && callback();
}
