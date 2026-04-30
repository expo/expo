import { type ComponentPropsWithoutRef, type PropsWithChildren, type ReactNode } from 'react';
export type ServerDocumentData = {
    bodyAttributes?: ComponentPropsWithoutRef<'body'>;
    htmlAttributes?: ComponentPropsWithoutRef<'html'>;
    bodyNodes?: ReactNode;
    headNodes?: ReactNode;
};
export declare function useServerDocumentContext(): ServerDocumentData;
type ServerDocumentProps = PropsWithChildren<{
    data: ServerDocumentData | null;
}>;
export declare function ServerDocument({ children, data }: ServerDocumentProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=ServerDocument.d.ts.map