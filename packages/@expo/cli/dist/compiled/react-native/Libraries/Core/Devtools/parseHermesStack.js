'use strict';

var RE_FRAME = /^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.*?):(\d+):(\d+)\))$/;
var RE_SKIPPED = /^ {4}... skipping (\d+) frames$/;
function isInternalBytecodeSourceUrl(sourceUrl) {
  return sourceUrl === 'InternalBytecode.js';
}
function parseLine(line) {
  var asFrame = line.match(RE_FRAME);
  if (asFrame) {
    return {
      type: 'FRAME',
      functionName: asFrame[1],
      location: asFrame[2] === 'native' ? {
        type: 'NATIVE'
      } : asFrame[3] === 'address at ' ? isInternalBytecodeSourceUrl(asFrame[4]) ? {
        type: 'INTERNAL_BYTECODE',
        sourceUrl: asFrame[4],
        line1Based: Number.parseInt(asFrame[5], 10),
        virtualOffset0Based: Number.parseInt(asFrame[6], 10)
      } : {
        type: 'BYTECODE',
        sourceUrl: asFrame[4],
        line1Based: Number.parseInt(asFrame[5], 10),
        virtualOffset0Based: Number.parseInt(asFrame[6], 10)
      } : {
        type: 'SOURCE',
        sourceUrl: asFrame[4],
        line1Based: Number.parseInt(asFrame[5], 10),
        column1Based: Number.parseInt(asFrame[6], 10)
      }
    };
  }
  var asSkipped = line.match(RE_SKIPPED);
  if (asSkipped) {
    return {
      type: 'SKIPPED',
      count: Number.parseInt(asSkipped[1], 10)
    };
  }
}
module.exports = function parseHermesStack(stack) {
  var lines = stack.split(/\n/);
  var entries = [];
  var lastMessageLine = -1;
  for (var i = 0; i < lines.length; ++i) {
    var line = lines[i];
    if (!line) {
      continue;
    }
    var entry = parseLine(line);
    if (entry) {
      entries.push(entry);
      continue;
    }
    lastMessageLine = i;
    entries = [];
  }
  var message = lines.slice(0, lastMessageLine + 1).join('\n');
  return {
    message: message,
    entries: entries
  };
};
//# sourceMappingURL=parseHermesStack.js.map