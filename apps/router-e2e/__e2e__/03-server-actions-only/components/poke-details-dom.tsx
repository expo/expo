'use dom';

import React, { useMemo } from 'react';
import { ActivityIndicator } from 'react-native';

import { PokemonDetail } from './poke-details';

export default function ServerActionTest({ id }: { id: string, dom?: import('expo/dom').DOMProps }) {
    const contents = useMemo(() => PokemonDetail({ id }), [])
    return (

        <React.Suspense fallback={<ActivityIndicator />}>
            {contents}
        </React.Suspense>
    );
}
