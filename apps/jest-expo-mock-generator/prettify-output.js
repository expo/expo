const fs = require('fs');
const path = require('path');

// Ensure input file is passed
if (process.argv.length !== 3 || !fs.existsSync(path.resolve(process.argv[2]))) {
  console.error(`
Pass existing input file with logs to prettify! e.g. 'yarn prettify-output output.txt'
  `);
  process.exit(1);
}

const inputFile = path.resolve(process.argv[2]);
const inputFileBasename = path.basename(inputFile);
const outputFileName = `${inputFileBasename
  .split('.')
  .slice(0, -1)
  .join('.')}.js`;

// Read file and extract stringified js object
const minifiedFileContent = fs.readFileSync(inputFile, 'utf-8').trim();
const stringifiedObject = minifiedFileContent.replace(/^module\.exports = /, '').replace(/;$/, '');
let object;
try {
  object = JSON.parse(stringifiedObject);
} catch (e) {
  console.error(`
Parsing object from JSON failed!
Please see failing JSON:

${stringifiedObject}

Error: ${e}

  `);
  process.exit(1);
}

function calculateObjectDepth(object) {
  if (Array.isArray(object)) {
    return 1;
  }
  let level = 0;
  for (const key in object) {
    if (!object.hasOwnProperty(key)) {
      continue;
    }
    if (typeof object[key] === 'object') {
      const depth = calculateObjectDepth(object[key]) + 1;
      level = Math.max(depth, level);
    }
  }
  return level;
}

function serializeObject(object, numberOfSpacesIndent = 2) {
  if (object === null) {
    return 'null';
  }

  if (object === undefined) {
    return 'undefined';
  }

  if (typeof object === 'string' || object instanceof String) {
    return `'${object}'`;
  }

  if (typeof object === 'number' || typeof object === 'boolean') {
    return object;
  }

  const objectDepth = calculateObjectDepth(object);

  const inline = objectDepth === 0;
  const indent = ' '.repeat(numberOfSpacesIndent);

  if (Array.isArray(object)) {
    if (object.length === 0) {
      return '[]';
    }
    const serializedEntriesArray = object.map(value =>
      serializeObject(value, numberOfSpacesIndent)
    );

    // inline - single entry in array
    if (serializedEntriesArray.length === 1) {
      return `[${serializedEntriesArray[0]}]`;
    }

    const serializedEntries = serializedEntriesArray.join(',\n').replace(/^/gm, indent);
    return `[\n${serializedEntries},\n]`;
  }

  if (Object.entries(object).length === 0) {
    return '{}';
  }

  const entries = Object.entries(object);

  const entriesSerialized = entries
    .map(([key, value]) => {
      return `${key}: ${serializeObject(value, numberOfSpacesIndent)}`;
    })
    .join(inline ? ', ' : ',\n');

  if (inline) {
    return `{ ${entriesSerialized} }`;
  }

  return `{\n${entriesSerialized.replace(/^/gm, indent)},\n}`;
}

const serializedJSON = `module.exports = ${serializeObject(object)};\n`;

fs.writeFileSync(path.resolve(outputFileName), serializedJSON);
