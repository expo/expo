import { Image, Text, View } from '../lib/react-native';

export async function Pokemon({ id }: { id: number }) {
  // await new Promise((res) => setTimeout(res, 1000));
  const res = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
  const json = await res.json();
  return (
    <View style={{ padding: 8, borderWidth: 1 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 24 }}>{json.name}</Text>
      <Image source={{ uri: json.sprites.front_default }} style={{ width: 100, height: 100 }} />
      {json.abilities.map((ability) => (
        <Text key={ability.ability.name}>- {ability.ability.name}</Text>
      ))}
    </View>
  );
}
