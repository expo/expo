export interface Schema extends SchemaProperty {
  definitions?: Record<string, any>;
  [key: string]: any;
}

export interface SchemaProperty {
  $ref?: string;

  type?: string;
  enum?: string[];
  const?: string;

  required?: string[];
  description?: string;
  markdownDescription?: string;

  items?: any;
  oneOf?: any;
  anyOf?: any;
  format?: string;

  properties?: Record<string, SchemaProperty>;
}
