import { ResourceGroupXML, ResourceItemXML, ResourceKind, ResourceXML } from './Resources';
export declare function readStylesXMLAsync({ path, fallback, }: {
    path: string;
    fallback?: string | null;
}): Promise<ResourceXML>;
export declare function getProjectStylesXMLPathAsync(projectRoot: string, { kind }?: {
    kind?: ResourceKind;
}): Promise<string>;
export declare function getStyleParent(xml: ResourceXML, group: {
    name: string;
    parent?: string;
}): ResourceGroupXML | null;
export declare function getStylesItem({ name, xml, parent, }: {
    name: string;
    xml: ResourceXML;
    parent: {
        name: string;
        parent?: string;
    };
}): ResourceItemXML | null;
export declare function setStylesItem({ item, xml, parent, }: {
    item: ResourceItemXML;
    xml: ResourceXML;
    parent: {
        name: string;
        parent: string;
    };
}): ResourceXML;
export declare function removeStylesItem({ name, xml, parent, }: {
    name: string;
    xml: ResourceXML;
    parent: {
        name: string;
        parent: string;
    };
}): ResourceXML;
export declare function getAppThemeLightNoActionBarGroup(): {
    name: string;
    parent: string;
};
export declare function assignStylesValue(xml: ResourceXML, { add, value, targetApi, name, parent, }: {
    add: boolean;
    value: string;
    targetApi?: string;
    name: string;
    parent: {
        name: string;
        parent: string;
    };
}): ResourceXML;
/**
 * Helper to convert a styles.xml parent's children into a simple k/v pair.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
export declare function getStylesGroupAsObject(xml: ResourceXML, group: {
    name: string;
    parent?: string;
}): Record<string, string> | null;
