export type FileType = {
    path: string;
    content: string;
};
export type Structure = {
    'key.substructure': Structure[];
    'key.typename': string;
    'key.name': string;
    'key.kind': string;
    'key.offset': number;
    'key.length': number;
};
export type CursorInfoOutput = {
    'key.fully_annotated_decl': string;
    'key.annotated_decl': string;
};
export type FullyAnnotatedDecl = {
    'decl.function.free': {
        'decl.var.parameter': {
            'decl.var.parameter.argument_label': string;
            'decl.var.parameter.type': string;
        }[];
        'decl.function.returntype': string;
    };
};
export type ClosureTypes = {
    parameters: {
        name: any;
        typename: any;
    }[];
    returnType: any;
};
export type Closure = {
    name: string;
    types: ClosureTypes | null;
};
export type Prop = {
    name: string;
    types: Omit<ClosureTypes, 'returnType'>;
};
export type OutputModuleDefinition = {
    name: string;
    views: OutputNestedClassDefinition[];
    classes: OutputNestedClassDefinition[];
    events: {
        name: string;
    }[];
} & Record<'asyncFunctions' | 'functions' | 'properties', Closure[]> & Record<'props', Prop[]>;
export type OutputNestedClassDefinition = Omit<OutputModuleDefinition, 'views' | 'classes'>;
//# sourceMappingURL=types.d.ts.map