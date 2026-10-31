export type PropertiesItem =
  | {
      type: 'comment';
      value: string;
    }
  | {
      type: 'empty';
    }
  | {
      type: 'property';
      key: string;
      value: string;
    };

export function parsePropertiesFile(contents: string): PropertiesItem[] {
  const propertiesList: PropertiesItem[] = [];
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) {
      propertiesList.push({ type: 'empty' });
    } else if (line.startsWith('#')) {
      propertiesList.push({ type: 'comment', value: line.substring(1).trimStart() });
    } else {
      const eok = line.indexOf('=');
      const key = eok === -1 ? line : line.slice(0, eok);
      let value = eok === -1 ? '' : line.slice(eok + 1, line.length);
      // An odd number of trailing backslashes continues the value on the next line.
      while (value.match(/\\*$/)![0].length % 2 === 1 && i + 1 < lines.length) {
        i++;
        value += '\n' + lines[i]!.trimEnd();
      }
      propertiesList.push({ type: 'property', key, value });
    }
  }

  return propertiesList;
}

export function propertiesListToString(props: PropertiesItem[]): string {
  let output = '';
  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    if (prop != null) {
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
    }
    if (i < props.length - 1) {
      output += '\n';
    }
  }
  return output;
}
