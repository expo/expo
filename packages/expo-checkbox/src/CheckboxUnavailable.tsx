import { UnavailabilityError } from '@unimodules/core';

import { CheckboxComponent } from './Checkbox.types';

const CheckboxUnavailable: CheckboxComponent = () => {
  throw new UnavailabilityError('expo-checkbox', 'Checkbox');
};

CheckboxUnavailable.isAvailableAsync = async () => false;

export default CheckboxUnavailable;
