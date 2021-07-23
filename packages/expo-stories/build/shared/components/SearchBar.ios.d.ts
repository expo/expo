export default function SearchBar({ textColor, cancelButtonText, tintColor, placeholderTextColor, onChangeQuery, onSubmit, onCancelPress, initialValue, }: {
    initialValue?: string;
    cancelButtonText?: string;
    selectionColor?: string;
    tintColor: string;
    placeholderTextColor?: string;
    underlineColorAndroid?: string;
    textColor?: string;
    onSubmit?: (query: string) => void;
    onChangeQuery?: (query: string) => void;
    onCancelPress?: (goBack: () => void) => void;
}): JSX.Element;
