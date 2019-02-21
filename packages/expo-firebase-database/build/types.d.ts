export declare type DatabaseModifier = {
    id: string;
    type: 'orderBy' | 'limit' | 'filter';
    name?: string;
    key?: string;
    limit?: number;
    value?: any;
    valueType?: string;
};
export declare type DatabaseModule = any;
