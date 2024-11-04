import React from 'react';

import PokemonDetail from '../../components/poke-details-dom';
import { useLocalSearchParams } from 'expo-router';

export default function ServerActionTest() {
    const { id } = useLocalSearchParams()
    return (
       <PokemonDetail id={id} />
    );
}
