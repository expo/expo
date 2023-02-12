import { ResourceItemXML, ResourceKind, ResourceXML } from './Resources';
export declare function getProjectStringsXMLPathAsync(projectRoot: string, { kind }?: {
    kind?: ResourceKind;
}): Promise<string>;
export declare function setStringItem(itemToAdd: ResourceItemXML[], stringFileContentsJSON: ResourceXML): ResourceXML;
export declare function removeStringItem(named: string, stringFileContentsJSON: ResourceXML): ResourceXML;
