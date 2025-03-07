import { ContextMenuProps } from '.';
export declare function Submenu(): import("react").JSX.Element;
export declare function Items(): import("react").JSX.Element;
export declare namespace Items {
    var tag: string;
}
export declare function Trigger(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare namespace Trigger {
    var tag: string;
}
export declare function Preview(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
declare function ContextMenu(props: ContextMenuProps): import("react").JSX.Element;
declare namespace ContextMenu {
    var Trigger: typeof import("./index.android").Trigger;
    var Preview: typeof import("./index.android").Preview;
    var Items: typeof import("./index.android").Items;
}
export { ContextMenu };
//# sourceMappingURL=index.android.d.ts.map