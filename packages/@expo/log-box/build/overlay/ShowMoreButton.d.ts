import React from 'react';
import type { Message } from '../Data/Types';
export default function ShowMoreButton({ message, collapsed, onPress, }: {
    collapsed: boolean;
    message: Message;
    onPress: () => void;
}): React.JSX.Element | null;
