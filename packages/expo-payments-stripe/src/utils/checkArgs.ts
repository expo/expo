import ReactPropTypesSecret from 'prop-types/lib/ReactPropTypesSecret';

interface TypeSpecs {
  [key: string]: (
    values: any,
    typeSpecName: string,
    componentName: string,
    location: string,
    propFullName: string,
    secret: any
  ) => any;
}

export default function checkArgs(
  typeSpecs: TypeSpecs,
  values: any,
  location: string,
  componentName: string
) {
  if (process.env.NODE_ENV !== 'production') {
    for (const typeSpecName in typeSpecs) {
      if (typeSpecs.hasOwnProperty(typeSpecName)) {
        const error = typeSpecs[typeSpecName](
          values,
          typeSpecName,
          componentName,
          location,
          typeSpecName,
          ReactPropTypesSecret
        );
        if (error instanceof Error) {
          throw new Error(`Failed ${location} type: ${error.message}`);
        }
      }
    }
  }
}
