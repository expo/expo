import { XMLObject } from '../utils/XML';
export declare type ResourceGroupXML = {
    $: {
        name: string;
        parent: string;
    };
    item: ResourceItemXML[];
};
export declare type ResourceXML = {
    resources: {
        $?: {
            'xmlns:tools'?: string;
        };
        color?: ResourceItemXML[];
        string?: ResourceItemXML[];
        style?: ResourceGroupXML[];
    };
};
export declare type ResourceItemXML = {
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
export declare type ResourceKind = 'values' | 'values-night' | 'values-v23' | 'values-night-v23' | 'drawable';
/**
 * Read an XML file while providing a default fallback for resource files.
 *
 * @param options path to the XML file, returns a fallback XML if the path doesn't exist.
 */
export declare function readResourcesXMLAsync({ path, fallback, }: {
    path: string;
    fallback?: string | null;
}): Promise<ResourceXML>;
/**
 * Ensure the provided xml has a `resources` object (the expected shape).
 *
 * @param xml
 */
export declare function ensureDefaultResourceXML(xml: XMLObject): ResourceXML;
/**
 * Build a `ResourceItemXML` given its `name` and `value`. This makes things a bit more readable.
 *
 * - JSON: `{ $: { name }, _: value }`
 * - XML: `<item name="NAME">VALUE</item>`
 *
 * @param props name and value strings.
 */
export declare function buildResourceItem({ name, value, targetApi, translatable, }: {
    name: string;
    value: string;
    targetApi?: string;
    translatable?: boolean;
}): ResourceItemXML;
export declare function buildResourceGroup(parent: {
    name: string;
    parent: string;
    items?: ResourceItemXML[];
}): ResourceGroupXML;
export declare function findResourceGroup(xml: ResourceGroupXML[] | undefined, group: {
    name: string;
    parent?: string;
}): ResourceGroupXML | null;
/**
 * Helper to convert a basic XML object into a simple k/v pair.
 *
 * @param xml
 * @returns
 */
export declare function getResourceItemsAsObject(xml: ResourceItemXML[]): Record<string, string> | null;
/**
 * Helper to convert a basic k/v object to a ResourceItemXML array.
 *
 * @param xml
 * @returns
 */
export declare function getObjectAsResourceItems(obj: Record<string, string>): ResourceItemXML[];
export declare function getObjectAsResourceGroup(group: {
    name: string;
    parent: string;
    item: Record<string, string>;
}): ResourceGroupXML;
