import { ResourceItemXML, ResourceKind, ResourceXML } from './Resources';
export declare function getProjectColorsXMLPathAsync(projectRoot: string, { kind }?: {
    kind?: ResourceKind;
}): Promise<string>;
export declare function setColorItem(itemToAdd: ResourceItemXML, colorFileContentsJSON: ResourceXML): ResourceXML;
export declare function removeColorItem(named: string, contents: ResourceXML): ResourceXML;
/**
 * Set or remove value in XML based on nullish factor of the `value` property.
 */
export declare function assignColorValue(xml: ResourceXML, { value, name, }: {
    value?: string | null;
    name: string;
}): ResourceXML;
/**
 * Helper to convert a basic XML object into a simple k/v pair.
 * `colors.xml` is a very basic XML file so this is pretty safe to do.
 * Added for testing purposes.
 *
 * @param xml
 * @returns
 */
export declare function getColorsAsObject(xml: ResourceXML): Record<string, string> | null;
/**
 * Helper to convert a basic k/v object to a colors XML object.
 *
 * @param xml
 * @returns
 */
export declare function getObjectAsColorsXml(obj: Record<string, string>): ResourceXML;
