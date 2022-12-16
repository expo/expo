import { readXMLAsync, XMLObject } from '../utils/XML';

export type ResourceGroupXML = {
  $: {
    name: string;
    parent: string;
  };
  item: ResourceItemXML[];
};

export type ResourceXML = {
  resources: {
    $?: {
      'xmlns:tools'?: string;
    };
    color?: ResourceItemXML[];
    string?: ResourceItemXML[];
    style?: ResourceGroupXML[];
    // Add more if needed...
  };
};

export type ResourceItemXML = {
  _: string;
  $: {
    name: string;
    'tools:targetApi'?: string;
    translatable?: string;
  };
};
/**
 * Name of the resource folder.
 */
export type ResourceKind =
  | 'values'
  | 'values-night'
  | 'values-v23'
  | 'values-night-v23'
  | 'drawable';

const fallbackResourceString = `<?xml version="1.0" encoding="utf-8"?><resources></resources>`;

/**
 * Read an XML file while providing a default fallback for resource files.
 *
 * @param options path to the XML file, returns a fallback XML if the path doesn't exist.
 */
export async function readResourcesXMLAsync({
  path,
  fallback = fallbackResourceString,
}: {
  path: string;
  fallback?: string | null;
}): Promise<ResourceXML> {
  const xml = await readXMLAsync({ path, fallback });
  // Ensure the type is expected.
  if (!xml.resources) {
    xml.resources = {};
  }
  return xml as ResourceXML;
}

/**
 * Ensure the provided xml has a `resources` object (the expected shape).
 *
 * @param xml
 */
export function ensureDefaultResourceXML(xml: XMLObject): ResourceXML {
  if (!xml) {
    xml = { resources: {} };
  }
  if (!xml.resources) {
    xml.resources = {};
  }

  return xml as ResourceXML;
}

/**
 * Build a `ResourceItemXML` given its `name` and `value`. This makes things a bit more readable.
 *
 * - JSON: `{ $: { name }, _: value }`
 * - XML: `<item name="NAME">VALUE</item>`
 *
 * @param props name and value strings.
 */
export function buildResourceItem({
  name,
  value,
  targetApi,
  translatable,
}: {
  name: string;
  value: string;
  targetApi?: string;
  translatable?: boolean;
}): ResourceItemXML {
  const item: ResourceItemXML = { $: { name }, _: value };
  if (targetApi) {
    item.$['tools:targetApi'] = targetApi;
  }
  if (translatable !== undefined) {
    item.$['translatable'] = String(translatable);
  }
  return item;
}

export function buildResourceGroup(parent: {
  name: string;
  parent: string;
  items?: ResourceItemXML[];
}): ResourceGroupXML {
  return {
    $: { name: parent.name, parent: parent.parent },
    item: parent.items ?? [],
  };
}

export function findResourceGroup(
  xml: ResourceGroupXML[] | undefined,
  group: { name: string; parent?: string }
): ResourceGroupXML | null {
  const app = xml?.filter?.(({ $: head }) => {
    let matches = head.name === group.name;
    if (group.parent != null && matches) {
      matches = head.parent === group.parent;
    }
    return matches;
  })?.[0];
  return app ?? null;
}

/**
 * Helper to convert a basic XML object into a simple k/v pair.
 *
 * @param xml
 * @returns
 */
export function getResourceItemsAsObject(xml: ResourceItemXML[]): Record<string, string> | null {
  return xml.reduce(
    (prev, curr) => ({
      ...prev,
      [curr.$.name]: curr._,
    }),
    {}
  );
}

/**
 * Helper to convert a basic k/v object to a ResourceItemXML array.
 *
 * @param xml
 * @returns
 */
export function getObjectAsResourceItems(obj: Record<string, string>): ResourceItemXML[] {
  return Object.entries(obj).map(([name, value]) => ({
    $: { name },
    _: value,
  }));
}

export function getObjectAsResourceGroup(group: {
  name: string;
  parent: string;
  item: Record<string, string>;
}): ResourceGroupXML {
  return {
    $: {
      name: group.name,
      parent: group.parent,
    },
    item: getObjectAsResourceItems(group.item),
  };
}
