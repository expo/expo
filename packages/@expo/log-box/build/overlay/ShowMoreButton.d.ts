import React from 'react';
import { Message } from '../Data/Types';
export default function ShowMoreButton({ message, collapsed, onPress, }: {
    collapsed: boolean;
    message: Message;
    onPress: () => void;
}): React.JSX.Element | null;
