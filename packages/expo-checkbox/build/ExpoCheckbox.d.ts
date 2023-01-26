import React from 'react';
import { CheckboxProps } from './Checkbox.types';
export default class ExpoCheckbox extends React.PureComponent<CheckboxProps> {
    /**
     * @deprecated Currently, `Checkbox` supports all the platforms, so `isAvailableAsync()` method is deprecated and will be removed in future releases.
     */
    static isAvailableAsync(): Promise<boolean>;
    private handleChange;
    render(): JSX.Element;
}
//# sourceMappingURL=ExpoCheckbox.d.ts.map