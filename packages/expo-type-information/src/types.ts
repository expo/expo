export type FileType = {
  path: string;
  content: string;
};

export type Attribute = {
  'key.attribute': string;
  'key.length': number;
  'key.offset': number;
};

export type Structure = {
  'key.substructure': Structure[];
  'key.typename': string;
  'key.name': string;
  'key.kind': string;
  'key.offset': number;
  'key.length': number;
  'key.nameoffset': number;
  'key.namelength': number;
  'key.inheritedtypes': { 'key.name': string }[];
  'key.attributes': Attribute[];
};
