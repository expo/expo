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

function isPropertySpace(char: string | undefined): boolean {
  return char === ' ' || char === '\t' || char === '\f';
}

function endsWithContinuation(text: string): boolean {
  let index = text.length;
  while (text[index - 1] === '\\') {
    index--;
  }
  return (text.length - index) % 2 === 1;
}

function skipPropertySpace(line: string, index: number): number {
  while (isPropertySpace(line[index])) {
    index++;
  }
  return index;
}

function splitProperty(line: string): { key: string; value: string } {
  let index = 0;
  while (index < line.length) {
    const char = line[index]!;
    if (char === '\\' && index + 1 < line.length) {
      index += 2;
      continue;
    }
    if (char === '=' || char === ':' || isPropertySpace(char)) {
      break;
    }
    index++;
  }

  const key = line.slice(0, index);
  const separator = line[index];
  if (!separator) {
    return { key, value: '' };
  }

  index++;
  if (separator === '=' || separator === ':') {
    return { key, value: line.slice(skipPropertySpace(line, index)) };
  }

  index = skipPropertySpace(line, index);
  if (line[index] === '=' || line[index] === ':') {
    index = skipPropertySpace(line, index + 1);
  }
  return { key, value: line.slice(index) };
}

export function parsePropertiesFile(contents: string): PropertiesItem[] {
  const propertiesList: PropertiesItem[] = [];
  const lines = contents.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) {
      propertiesList.push({ type: 'empty' });
    } else if (line.startsWith('#') || line.startsWith('!')) {
      propertiesList.push({ type: 'comment', value: line.substring(1).trimStart() });
    } else {
      let split = splitProperty(line);
      // The writer inserts '=' after the key, and a leftover '\' would escape it.
      while (split.value === '' && endsWithContinuation(split.key)) {
        if (i + 1 >= lines.length) {
          split = splitProperty(split.key.slice(0, -1));
          break;
        }
        i++;
        const trimmed = lines[i]!.trimEnd();
        const next = trimmed.slice(skipPropertySpace(trimmed, 0));
        split = splitProperty(split.key.slice(0, -1) + next);
      }

      let { key, value } = split;
      // An odd number of trailing backslashes continues the value on the next line.
      while (endsWithContinuation(value) && i + 1 < lines.length) {
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
