import { UnavailabilityError } from '@unimodules/core';
const CheckboxUnavailable = () => {
    throw new UnavailabilityError('expo-checkbox', 'Checkbox');
};
CheckboxUnavailable.isAvailableAsync = async () => false;
export default CheckboxUnavailable;
//# sourceMappingURL=CheckboxUnavailable.js.map