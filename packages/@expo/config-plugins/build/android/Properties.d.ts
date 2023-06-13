export type PropertiesItem = {
    type: 'comment';
    value: string;
} | {
    type: 'empty';
} | {
    type: 'property';
    key: string;
    value: string;
};
export declare function parsePropertiesFile(contents: string): PropertiesItem[];
export declare function propertiesListToString(props: PropertiesItem[]): string;
