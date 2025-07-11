import { type ViewProps } from 'react-native';
export interface ModalConfig {
    component: React.ReactNode;
    uniqueId: string;
    animationType?: 'slide' | 'fade' | 'none';
    presentationStyle?: 'fullScreen' | 'overFullScreen' | 'pageSheet' | 'formSheet';
    transparent?: boolean;
    viewProps?: ViewProps;
    detents?: number[] | 'fitToContents';
}
export interface ModalsRendererProps {
    children?: React.ReactNode;
    modalConfigs: ModalConfig[];
    onDismissed?: (id: string) => void;
    onShow?: (id: string) => void;
}
//# sourceMappingURL=types.d.ts.map