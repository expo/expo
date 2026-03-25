import * as React from 'react';
type Props = {
    /**
     * Whether lazy rendering is enabled.
     */
    enabled: boolean;
    /**
     * Whether the component is visible.
     */
    visible: boolean;
    /**
     * Content to render.
     */
    children: React.ReactElement;
};
/**
 * Render content lazily based on visibility.
 *
 * When enabled:
 * - If content is visible, it will render immediately
 * - If content is not visible, it won't render until it becomes visible
 *
 * Otherwise:
 * - If content is visible, it will render immediately
 * - If content is not visible, it will defer rendering until idle
 *
 * Once rendered, the content remains rendered.
 */
export declare function Lazy({ enabled, visible, children }: Props): React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | null;
export {};
//# sourceMappingURL=Lazy.d.ts.map