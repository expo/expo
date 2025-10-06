import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { type ViewProps } from 'react-native';
export interface ModalConfig {
    component: React.ReactNode;
    parentNavigationProp: NavigationProp<ParamListBase>;
    uniqueId: string;
    animationType?: 'slide' | 'fade' | 'none';
    presentationStyle?: 'fullScreen' | 'overFullScreen' | 'pageSheet' | 'formSheet';
    transparent?: boolean;
    viewProps?: ViewProps;
    detents?: number[] | 'fitToContents';
}
export interface DetentChangeData {
    index: number;
    stable: boolean;
}
export interface ModalsRendererProps {
    children?: React.ReactNode;
    modalConfigs: ModalConfig[];
    onDismissed?: (id: string) => void;
    onShow?: (id: string) => void;
    onDetentChange?: (id: string, data: DetentChangeData) => void;
}
//# sourceMappingURL=types.d.ts.map