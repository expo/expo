/**
 * You can add another Tuple signature if needed.
 * This type aggregates all known tuple-like types that are available across all APIs.
 */
export type Tuple = [number, number];

export type Platform = 'android' | 'ios' | 'web';

export type Parameter = {
  name: string;
  platforms?: Platform[];
};

export type BooleanParameter = Parameter & {
  type: 'boolean';
  initial: boolean;
};

export type StringParameter = Parameter & {
  type: 'string';
  values: (undefined | string)[];
};

export type NumberParameter = Parameter & {
  type: 'number';
  values: (undefined | number)[];
};

export type EnumParameter = Parameter & {
  type: 'enum';
  values: {
    name: string;
    value: any;
  }[];
};

export type PrimitiveParameter =
  | BooleanParameter
  | StringParameter
  | NumberParameter
  | EnumParameter;

export type ObjectParameter = Parameter & {
  type: 'object';
  properties: PrimitiveParameter[];
};

export type ConstantParameter = Parameter & {
  type: 'constant';
  value: any;
};

export type FunctionParameter = PrimitiveParameter | ObjectParameter | ConstantParameter;

export type PrimitiveArgument = boolean | number | string | Tuple | undefined;

export type FunctionArgument = PrimitiveArgument | Record<string, PrimitiveArgument>;

/**
 * Generic and intentionally not very well typed function signature to describe any action that can be called from the FunctionDemo.
 */
export type ActionFunction = (...args: any[]) => Promise<unknown> | unknown;

export type ArgumentName = string | [objectName: string, propertyName: string];

export type OnArgumentChangeCallback = (name: ArgumentName, value: PrimitiveArgument) => void;
