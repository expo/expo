'use server';

import Link from 'expo-router/link';

import '../../dom-components/global.css';

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

export async function renderPageTwo(params: { title: string }) {
  try {
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10');
    if (!response.ok) throw new Error('Failed to fetch Pokemon list');
    
    const data = await response.json();
    const pokemon: Pokemon[] = await Promise.all(
      data.results.map(async (p: { url: string }) => {
        const res = await fetch(p.url);
        if (!res.ok) throw new Error(`Failed to fetch Pokemon details for ${p.url}`);
        return res.json();
      })
    );

    return (
      <>
        <div className="p-6 max-w-7xl mx-auto bg-gradient-to-b from-blue-50 to-white min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {params.title} World of Pokemon
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pokemon.map((p: Pokemon) => (
              <Link href={`/pokemon/${p.id}`} key={p.id}>
                <div 
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="relative">
                    <div className="absolute -top-1 -right-1 bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                      #{p.id.toString().padStart(3, '0')}
                    </div>
                    <img 
                      src={p.sprites.front_default}
                      alt={`${p.name} sprite`}
                      style={{ width: 150, height: 150 }}
                      className="mx-auto object-contain"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-center capitalize mt-3 text-gray-800">{p.name}</h2>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {p.types.map((type) => (
                      <span 
                        key={type.type.name}
                        className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm"
                      >
                        {type.type.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-gray-500">Height</span>
                        <p className="font-semibold text-gray-800">{(p.height / 10).toFixed(1)}m</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-lg">
                        <span className="text-gray-500">Weight</span>
                        <p className="font-semibold text-gray-800">{(p.weight / 10).toFixed(1)}kg</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {p.stats.slice(0, 3).map((stat) => (
                        <div key={stat.stat.name} className="w-full">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span className="capitalize">{stat.stat.name}</span>
                            <span>{stat.base_stat}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                              style={{ width: `${Math.min(100, (stat.base_stat / 150) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error fetching Pokemon data:', error);
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p>Unable to load Pokemon data. Please try again later.</p>
      </div>
    );
  }
}
