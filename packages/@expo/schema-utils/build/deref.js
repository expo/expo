"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deref = deref;
/** Return JSON schema ref if input is of `NodeRef` type */
const getRef = node => node != null && typeof node === 'object' && '$ref' in node && typeof node.$ref === 'string' ? node.$ref : undefined;

/** Parse a JSON schema ref into a path array, or return undefined */
const parseRefMaybe = ref => {
  if (ref == null || ref[0] !== '#') {
    return undefined;
  }
  const props = [];
  let startIndex = 1;
  let index = 1;
  let char;
  while (index < ref.length) {
    while ((char = ref.charCodeAt(index++)) && char !== 47 /*'/'*/);
    const prop = ref.slice(startIndex, index - 1);
    startIndex = index;
    if (prop) props.push(prop);
  }
  return props.length ? props : undefined;
};
const NOT_FOUND_SYMBOL = Symbol();

/** Get value at given JSON schema path or return `NOT_FOUND_SYMBOL` */
const getValueAtPath = (input, ref) => {
  let node = input;
  for (let index = 0; index < ref.length; index++) {
    const part = ref[index];
    if (node != null && typeof node === 'object' && part in node) {
      node = node[part];
    } else {
      node = NOT_FOUND_SYMBOL;
      break;
    }
  }
  return node;
};

/** Find all JSON schema refs recursively and add them to `refs` Map */
const findRefsRec = (node, refs, path) => {
  if (node == null || typeof node !== 'object') {} else if (Array.isArray(node)) {
    for (let index = 0, l = node.length; index < l; index++) {
      const value = node[index];
      const ref = getRef(value);
      if (ref) {
        const targetRef = parseRefMaybe(ref);
        if (targetRef) refs.set([...path, index], targetRef);
      } else if (value != null && typeof value === 'object') {
        path.push(index);
        findRefsRec(value, refs, path);
        path.pop();
      }
    }
  } else {
    const record = node;
    for (const key in record) {
      const value = record[key];
      const ref = getRef(value);
      if (ref) {
        const targetRef = parseRefMaybe(ref);
        if (targetRef) refs.set([...path, key], targetRef);
      } else if (value != null && typeof value === 'object') {
        path.push(key);
        findRefsRec(value, refs, path);
        path.pop();
      }
    }
  }
};

/** Detect whether target (where we set the source value) is a nested path inside the source path */
const isSelfReferencingRefEntry = (target, source) => {
  for (let index = 0; index < source.length; index++) {
    if (source[index] !== target[index]) return false;
  }
  return true;
};

/** Return sorted refs entries. Longest target paths will be returned first */
const getSortedRefEntries = refs => {
  const entries = [...refs.entries()].sort((a, b) => b[1].length - a[1].length);
  // Filter out self-referenceing paths. If we set nested targets to source values, we'd
  // create unserializable circular references
  return entries.filter(entry => !isSelfReferencingRefEntry(entry[0], entry[1]));
};

/** Dereference JSON schema pointers.
 *
 * @remarks
 * This is a minimal reimplementation of `json-schema-deref-sync` without
 * file reference, URL/web reference, and loader support.
 *
 * @see https://github.com/cvent/json-schema-deref-sync
 */
function deref(input) {
  const refs = new Map();
  // Find all JSON schema refs paths
  findRefsRec(input, refs, []);
  // Shallow copy output
  const output = {
    ...input
  };
  // Process all ref entries with deepest targets first
  nextRef: for (const [target, source] of getSortedRefEntries(refs)) {
    let inputNode = input;
    let outputNode = output;
    let targetIndex = 0;
    // For each path part on the target, traverse the output and clone the input
    // to not pollute it
    for (; targetIndex < target.length - 1; targetIndex++) {
      const part = target[targetIndex];
      if (inputNode == null || typeof inputNode !== 'object' || !(part in inputNode)) {
        // If the part doesn't exist, we abort
        break;
      } else if (outputNode[part] === inputNode[part]) {
        // Copy the input on the output if references are equal
        outputNode[part] = Array.isArray(inputNode[part]) ? [...inputNode[part]] : {
          ...inputNode[part]
        };
        inputNode = inputNode[part];
        outputNode = outputNode[part];
      } else {
        // If this part has already been copied, abort
        break;
      }
    }
    // For each remaining part on the target, continue traversing the output
    for (; targetIndex < target.length - 1; targetIndex++) {
      const part = target[targetIndex];
      if (outputNode == null || typeof outputNode !== 'object' || !(part in outputNode)) {
        // If the part doesn't exist, skip the entire ref
        continue nextRef;
      } else {
        outputNode = outputNode[part];
      }
    }
    // Get value from output
    let sourceValue = getValueAtPath(output, source);
    if (sourceValue === NOT_FOUND_SYMBOL) {
      // If no value was found, try to get a value from the input instead
      sourceValue = getValueAtPath(input, source);
      // Otherwise, skip this ref
      if (sourceValue === NOT_FOUND_SYMBOL) continue;
    }
    // Set the source value on the target path
    // The for-loops prior have made sure that the output has already been deeply
    // cloned and traversed for the entire path
    outputNode[target[target.length - 1]] = sourceValue;
  }
  // Handle root refs last
  const rootTargetRef = parseRefMaybe(getRef(input));
  if (rootTargetRef) {
    // Get value from output
    let sourceValue = getValueAtPath(output, rootTargetRef);
    // If no value was found, try to get a value from the input instead
    if (sourceValue === NOT_FOUND_SYMBOL) {
      sourceValue = getValueAtPath(input, rootTargetRef);
    }
    // Assign the target object to the output
    if (sourceValue !== NOT_FOUND_SYMBOL && sourceValue != null) {
      return typeof sourceValue === 'object' ? {
        ...sourceValue,
        title: output.title,
        description: output.description
      } : sourceValue;
    }
  }
  // Return the output with resolved refs
  return output;
}
//# sourceMappingURL=deref.js.map