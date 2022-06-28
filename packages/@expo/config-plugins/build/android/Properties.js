"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parsePropertiesFile = parsePropertiesFile;
exports.propertiesListToString = propertiesListToString;

function parsePropertiesFile(contents) {
  const propertiesList = [];
  const lines = contents.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      propertiesList.push({
        type: 'empty'
      });
    } else if (line.startsWith('#')) {
      propertiesList.push({
        type: 'comment',
        value: line.substring(1).trimStart()
      });
    } else {
      const eok = line.indexOf('=');
      const key = line.slice(0, eok);
      const value = line.slice(eok + 1, line.length);
      propertiesList.push({
        type: 'property',
        key,
        value
      });
    }
  }

  return propertiesList;
}

function propertiesListToString(props) {
  let output = '';

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];

    if (prop.type === 'empty') {
      output += '';
    } else if (prop.type === 'comment') {
      output += '# ' + prop.value;
    } else if (prop.type === 'property') {
      output += `${prop.key}=${prop.value}`;
    } else {
      // @ts-ignore: assertion
      throw new Error(`Invalid properties type "${prop.type}"`);
    }

    if (i < props.length - 1) {
      output += '\n';
    }
  }

  return output;
}
//# sourceMappingURL=Properties.js.map