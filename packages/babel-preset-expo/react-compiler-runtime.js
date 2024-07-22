// lib/react-compiler-runtime.js
const $empty = Symbol.for('react.memo_cache_sentinel');
const React = require('react');
/**
 * DANGER: this hook is NEVER meant to be called directly!
 *
 * Note that this is a temporary userspace implementation of this function
 * from React 19. It is not as efficient and may invalidate more frequently
 * than the official API. Please upgrade to React 19 as soon as you can.
 **/
export function c(size) {
  return React.useState(() => {
    const $ = new Array(size);
    for (let ii = 0; ii < size; ii++) {
      $[ii] = $empty;
    }
    // @ts-ignore
    $[$empty] = true;
    return $;
  })[0];
}
