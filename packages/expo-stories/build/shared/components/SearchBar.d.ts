export default function SearchBar({ selectionColor, tintColor, placeholderTextColor, underlineColorAndroid, textColor, onSubmit, onChangeQuery, initialValue, }: {
    initialValue?: string;
    selectionColor?: string;
    tintColor: string;
    placeholderTextColor?: string;
    underlineColorAndroid?: string;
    textColor?: string;
    onSubmit?: (query: string) => void;
    onChangeQuery?: (query: string) => void;
}): JSX.Element;
