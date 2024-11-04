'use server';

import { Screen } from 'expo-router/build/views/Screen';

import Link from 'expo-router/link';

interface Pokemon {
  id: number;
  name: string;
  sprites: {
    front_default: string;
  };
  types: Array<{
    type: {
      name: string;
    };
  }>;
  height: number;
  weight: number;
  stats: Array<{
    base_stat: number;
    stat: {
      name: string;
    };
  }>;
}

import '../../dom-components/global.css';

export async function PokemonDetail({ id }: { id: string }) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error('Failed to fetch Pokemon details');

    const pokemon: Pokemon = await response.json();
    return (
      <div className="min-h-screen w-full">
        <Screen options={{ title: pokemon.name }} />
        <div className="bg-white shadow-xl p-4 sm:p-8 backdrop-blur-sm bg-opacity-90 min-h-screen sm:min-h-0 sm:rounded-2xl sm:m-4 sm:max-w-4xl sm:mx-auto">
          <div className="relative mb-8">
            <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
              #{pokemon.id.toString().padStart(3, '0')}
            </div>
            <img
              src={pokemon.sprites.front_default}
              alt={`${pokemon.name} sprite`}
              style={{ width: 240, height: 240 }}
              className="mx-auto object-contain filter drop-shadow-lg"
            />
          </div>

          <h1 className="text-4xl font-bold text-center capitalize mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {pokemon.name}
          </h1>

          <div className="flex flex-wrap gap-3 justify-center mb-10">
            {pokemon.types.map((type) => (
              <span
                key={type.type.name}
                className="px-6 py-2.5 rounded-full text-base font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm hover:shadow-md transition-shadow duration-200">
                {type.type.name}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-gray-50 p-5 rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <span className="text-gray-500 text-sm">Height</span>
              <p className="text-2xl font-semibold text-gray-800">
                {(pokemon.height / 10).toFixed(1)}m
              </p>
            </div>
            <div className="bg-gray-50 p-5 rounded-xl hover:bg-gray-100 transition-colors duration-200">
              <span className="text-gray-500 text-sm">Weight</span>
              <p className="text-2xl font-semibold text-gray-800">
                {(pokemon.weight / 10).toFixed(1)}kg
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-2">Base Stats</h2>
            {pokemon.stats.map((stat) => (
              <div key={stat.stat.name} className="w-full">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span className="capitalize font-medium">{stat.stat.name}</span>
                  <span className="font-bold">{stat.base_stat}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-3 transition-all duration-500 shadow-inner"
                    style={{ width: `${Math.min(100, (stat.base_stat / 150) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching Pokemon details:', error);
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p>Unable to load Pokemon details. Please try again later.</p>
        <Link href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-800">
          Return to Pokemon List
        </Link>
      </div>
    );
  }
}
