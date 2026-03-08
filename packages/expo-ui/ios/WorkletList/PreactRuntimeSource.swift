// Copyright 2025-present 650 Industries. All rights reserved.

/// JavaScript source that gets eval'd into the worklet runtime (UI thread).
/// Provides a minimal `createElement` function and a bridge object for
/// rendering list items synchronously.
///
/// This is Phase 1 of the dual-runtime list renderer. It provides only
/// a pure createElement → descriptor tree pipeline. Phase 2 would add
/// Preact (~4KB) for hooks and reconciliation support.
let workletListRuntimeSource = """
(function() {
  'use strict';

  // Minimal createElement that produces descriptor objects.
  // Signature matches React's: createElement(type, props, ...children)
  function createElement(type, props) {
    var children = [];
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child == null || child === false || child === true) {
        continue;
      }
      if (Array.isArray(child)) {
        for (var j = 0; j < child.length; j++) {
          children.push(normalizeChild(child[j]));
        }
      } else {
        children.push(normalizeChild(child));
      }
    }
    return {
      type: type,
      props: props || {},
      children: children
    };
  }

  function normalizeChild(child) {
    if (child == null || child === false || child === true) {
      return null;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      return {
        type: '__text',
        props: { content: String(child) },
        children: []
      };
    }
    return child;
  }

  // Bridge object for Swift ↔ JS communication
  var bridge = {
    __renderFn: null,
    __renderFnReady: false,

    // Called by Swift to render a single item.
    // Returns a descriptor tree (plain object) or null.
    renderItem: function(item, index) {
      if (!bridge.__renderFn) {
        return null;
      }
      try {
        return bridge.__renderFn(item, index);
      } catch (e) {
        // Log but don't crash - return a fallback
        console.error('[WorkletList] renderItem error:', e);
        return createElement('Text', { content: 'Render error: ' + String(e) });
      }
    }
  };

  // Expose globals
  globalThis.createElement = createElement;
  globalThis.__workletListBridge = bridge;
})();
"""
