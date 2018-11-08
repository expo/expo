// Copied from https://github.com/douglascrockford/JSON-js/blob/master/cycle.js

/*
    cycle.js
    2018-05-15
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

export default function decycle(object: any, replacer?: ((any) => any)) {
  'use strict';

  // Make a deep copy of an object or array, assuring that there is at most
  // one instance of each object or array in the resulting structure. The
  // duplicate references (which might be forming cycles) are replaced with
  // an object of the form

  //      {"$ref": PATH}

  // where the PATH is a JSONPath string that locates the first occurance.

  // So,

  //      var a = [];
  //      a[0] = a;
  //      return JSON.stringify(JSON.decycle(a));

  // produces the string '[{"$ref":"$"}]'.

  // If a replacer function is provided, then it will be called for each value.
  // A replacer function receives a value and returns a replacement value.

  // JSONPath is used to locate the unique object. $ indicates the top level of
  // the object or array. [NUMBER] or [STRING] indicates a child element or
  // property.

  var objects = new WeakMap(); // object to path mappings

  return (function derez(value, path) {
    // The derez function recurses through the object, producing the deep copy.

    var old_path; // The path of an earlier occurance of value
    var nu; // The new object or array

    // If a replacer function was provided, then call it to get a replacement value.

    if (replacer !== undefined) {
      value = replacer(value);
    }

    // typeof null === "object", so go on if this value is really an object but not
    // one of the weird builtin objects.

    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Boolean) &&
      !(value instanceof Date) &&
      !(value instanceof Number) &&
      !(value instanceof RegExp) &&
      !(value instanceof String)
    ) {
      // If the value is an object or array, look to see if we have already
      // encountered it. If so, return a {"$ref":PATH} object. This uses an
      // ES6 WeakMap.

      old_path = objects.get(value);
      if (old_path !== undefined) {
        return { $ref: old_path };
      }

      // Otherwise, accumulate the unique value and its path.

      objects.set(value, path);

      // If it is an array, replicate the array.

      if (Array.isArray(value)) {
        nu = [];
        value.forEach(function(element, i) {
          nu[i] = derez(element, path + '[' + i + ']');
        });
      } else {
        // If it is an object, replicate the object.

        nu = {};
        Object.keys(value).forEach(function(name) {
          nu[name] = derez(value[name], path + '[' + JSON.stringify(name) + ']');
        });
      }
      return nu;
    }
    return value;
  })(object, '$');
}
