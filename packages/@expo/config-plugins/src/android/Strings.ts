import { getResourceXMLPathAsync } from './Paths';
import { ResourceItemXML, ResourceKind, ResourceXML } from './Resources';

export async function getProjectStringsXMLPathAsync(
  projectRoot: string,
  { kind }: { kind?: ResourceKind } = {}
): Promise<string> {
  return getResourceXMLPathAsync(projectRoot, { kind, name: 'strings' });
}

export function setStringItem(
  itemToAdd: ResourceItemXML[],
  stringFileContentsJSON: ResourceXML
): ResourceXML {
  if (!stringFileContentsJSON?.resources?.string) {
    if (!stringFileContentsJSON.resources || typeof stringFileContentsJSON.resources === 'string') {
      // file was empty and JSON is `{resources : ''}`
      stringFileContentsJSON.resources = {};
    }
    stringFileContentsJSON.resources.string = itemToAdd;
    return stringFileContentsJSON;
  }

  for (const newItem of itemToAdd) {
    const stringNameExists = stringFileContentsJSON.resources.string.findIndex(
      (e: ResourceItemXML) => e.$.name === newItem.$.name
    );
    if (stringNameExists > -1) {
      // replace the previous item
      stringFileContentsJSON.resources.string[stringNameExists] = newItem;
    } else {
      stringFileContentsJSON.resources.string =
        stringFileContentsJSON.resources.string.concat(newItem);
    }
  }
  return stringFileContentsJSON;
}

export function removeStringItem(named: string, stringFileContentsJSON: ResourceXML): ResourceXML {
  if (stringFileContentsJSON?.resources?.string) {
    const stringNameExists = stringFileContentsJSON.resources.string.findIndex(
      (e: ResourceItemXML) => e.$.name === named
    );
    if (stringNameExists > -1) {
      // replace the previous value
      stringFileContentsJSON.resources.string.splice(stringNameExists, 1);
    }
  }
  return stringFileContentsJSON;
}
