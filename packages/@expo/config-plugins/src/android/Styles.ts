import { getResourceXMLPathAsync } from './Paths';
import {
  buildResourceGroup,
  buildResourceItem,
  ensureDefaultResourceXML,
  findResourceGroup,
  getResourceItemsAsObject,
  readResourcesXMLAsync,
  ResourceGroupXML,
  ResourceItemXML,
  ResourceKind,
  ResourceXML,
} from './Resources';

// Adds support for `tools:x`
const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources xmlns:tools="http://schemas.android.com/tools"></resources>`;

export async function readStylesXMLAsync({
  path,
  fallback = fallbackResourceString,
}: {
  path: string;
  fallback?: string | null;
}): Promise<ResourceXML> {
  return readResourcesXMLAsync({ path, fallback });
}

export async function getProjectStylesXMLPathAsync(
  projectRoot: string,
  { kind }: { kind?: ResourceKind } = {}
): Promise<string> {
  return getResourceXMLPathAsync(projectRoot, { kind, name: 'styles' });
}

function ensureDefaultStyleResourceXML(xml: ResourceXML): ResourceXML {
  xml = ensureDefaultResourceXML(xml);
  if (!Array.isArray(xml?.resources?.style)) {
    xml.resources.style = [];
  }
  return xml;
}

export function getStyleParent(
  xml: ResourceXML,
  group: { name: string; parent?: string }
): ResourceGroupXML | null {
  return findResourceGroup(xml.resources.style, group);
}

export function getStylesItem({
  name,
  xml,
  parent,
}: {
  name: string;
  xml: ResourceXML;
  parent: { name: string; parent?: string };
}): ResourceItemXML | null {
  xml = ensureDefaultStyleResourceXML(xml);

  const appTheme = getStyleParent(xml, parent);

  if (!appTheme) {
    return null;
  }

  if (appTheme.item) {
    const existingItem = appTheme.item.filter(({ $: head }) => head.name === name)[0];

    // Don't want to 2 of the same item, so if one exists, we overwrite it
    if (existingItem) {
      return existingItem;
    }
  }
  return null;
}

export function setStylesItem({
  item,
  xml,
  parent,
}: {
  item: ResourceItemXML;
  xml: ResourceXML;
  parent: { name: string; parent: string };
}): ResourceXML {
  xml = ensureDefaultStyleResourceXML(xml);

  let appTheme = getStyleParent(xml, parent);

  if (!appTheme) {
    appTheme = buildResourceGroup(parent);
    xml.resources!.style!.push(appTheme);
  }

  if (appTheme.item) {
    const existingItem = appTheme.item.filter(({ $: head }) => head.name === item.$.name)[0];

    // Don't want to 2 of the same item, so if one exists, we overwrite it
    if (existingItem) {
      existingItem._ = item._;
      existingItem.$ = item.$;
    } else {
      appTheme.item.push(item);
    }
  } else {
    appTheme.item = [item];
  }
  return xml;
}

export function removeStylesItem({
  name,
  xml,
  parent,
}: {
  name: string;
  xml: ResourceXML;
  parent: { name: string; parent: string };
}): ResourceXML {
  xml = ensureDefaultStyleResourceXML(xml);
  const appTheme = getStyleParent(xml, parent);
  if (appTheme?.item) {
    const index = appTheme.item.findIndex(({ $: head }: ResourceItemXML) => head.name === name);
    if (index > -1) {
      appTheme.item.splice(index, 1);
    }
  }
  return xml;
}

// This is a very common theme so make it reusable.
export function getAppThemeLightNoActionBarGroup() {
  return { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' };
}

export function assignStylesValue(
  xml: ResourceXML,
  {
    add,
    value,
    targetApi,
    name,
    parent,
  }: {
    add: boolean;
    value: string;
    targetApi?: string;
    name: string;
    parent: { name: string; parent: string };
  }
): ResourceXML {
  if (add) {
    return setStylesItem({
      xml,
      parent,
      item: buildResourceItem({
        name,
        targetApi,
        value,
      }),
    });
  }
  return removeStylesItem({
    xml,
    parent,
    name,
  });
}

/**
 * Helper to convert a styles.xml parent's children into a simple k/v pair.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
export function getStylesGroupAsObject(
  xml: ResourceXML,
  group: { name: string; parent?: string }
): Record<string, string> | null {
  const xmlGroup = getStyleParent(xml, group);
  return xmlGroup?.item ? getResourceItemsAsObject(xmlGroup.item) : null;
}
