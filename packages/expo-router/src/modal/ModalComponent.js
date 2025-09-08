import { NavigationContext } from '@react-navigation/native';
export function ModalComponent({ modalConfig }) {
    const component = modalConfig.component;
    const navigationProp = modalConfig.parentNavigationProp;
    return <NavigationContext value={navigationProp}>{component}</NavigationContext>;
}
//# sourceMappingURL=ModalComponent.js.map