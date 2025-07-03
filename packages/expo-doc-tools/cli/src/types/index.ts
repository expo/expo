export interface Document {
    id: string;
    title: string;
    content: string;
    metadata?: Record<string, any>;
}

export interface Vector {
    id: string;
    values: number[];
}