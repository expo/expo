export type PropertyMeta = {
  regexHuman?: string;
  deprecated?: boolean;
  hidden?: boolean;
  bareWorkflow?: string;
};

export type Property = {
  description?: string;
  type?: string | string[];
  meta?: PropertyMeta;
  pattern?: string;
  enum?: string[];
  example?: any;
  exampleString?: string;
  host?: object;
  properties?: Record<string, Property>;
  items?: {
    properties?: Record<string, Property>;
  } & Record<string, any>;
  uniqueItems?: boolean;
  additionalProperties?: boolean;
  oneOf?: Record<string, Property>[];
};

export type FormattedProperty = {
  name: string;
  description: string;
  type?: string | string[];
  example?: any;
  bareWorkflow?: string;
  subproperties: FormattedProperty[];
  parent?: string;
  enum?: string[];
};
