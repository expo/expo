interface TypeSpecs {
    [key: string]: (values: any, typeSpecName: string, componentName: string, location: string, propFullName: string, secret: any) => any;
}
export default function checkArgs(typeSpecs: TypeSpecs, values: any, location: string, componentName: string): void;
export {};
