export type Tuple = [number, number];

export type Parameter = {
  name: string;
  platforms?: ('android' | 'ios' | 'web')[];
};

export type BooleanParameter = Parameter & {
  type: 'boolean';
  initial: boolean;
};

export type StringParameter = Parameter & {
  type: 'string';
  values: string[];
};

export type NumberParameter = Parameter & {
  type: 'number';
  values: number[];
};

export type EnumParameter = Parameter & {
  type: 'enum';
  values: {
    name: string;
    value: string | number | Tuple;
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

export type PrimitiveArgument = boolean | number | string | Tuple;

export type FunctionArgument = PrimitiveArgument | Record<string, PrimitiveArgument>;
