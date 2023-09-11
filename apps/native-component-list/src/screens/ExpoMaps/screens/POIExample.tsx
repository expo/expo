import * as Maps from 'expo-maps';
import React, { useContext, useState, useRef } from 'react';
import { StyleSheet, View, TextInput } from 'react-native';

import SwitchContainer from '../components/SwitchContainer';
import ProviderContext from '../context/ProviderContext';

export default function POIExample() {
  const provider = useContext(ProviderContext);
  const ref = useRef<Maps.ExpoMap>(null);
  const [enablePOISearching, setEnablePOISearching] = useState<boolean>(false);
  const [enablePOIs, setEnablePOIs] = useState<boolean>(false);
  const [enablePOIFilter, setEnablePOIFilter] = useState<boolean>(false);
  const [poiType, setPoiType] = useState<[] | [Maps.POICategoryType]>([]);
  const [enableQueryCompletions, setEnableQueryCompletions] = useState<boolean>(false);
  const [text, onChangeText] = useState<string>('');
  const [placeToSearch, setPlaceToSearch] = useState<string>('');
  const [enablePlaceSearch, setEnablePlaceSearch] = useState<boolean>(false);
  const [clickablePOIs, setClickablePOIs] = useState<boolean>(false);

  const appleMapsSearchRequest = 'Centrum Pompidou;Roue 1234';
  const googleMapsSearchRequest = 'Centrum Pompidou;ChIJoyC4CRxu5kcRRTPcWX5srLc';

  return (
    <View style={styles.mapContainer}>
      <Maps.ExpoMap
        style={{ flex: 1, width: '100%' }}
        provider={provider}
        enablePOISearching={enablePOISearching}
        enablePOIs={enablePOIs}
        enablePOIFilter={poiType}
        createPOISearchRequest={placeToSearch}
        clickablePOIs={clickablePOIs}
        ref={ref}
        initialCameraPosition={{
          target: {
            latitude: 48.85,
            longitude: 2.34,
          },
          zoom: 13,
        }}
      />
      <View style={styles.switchContainer}>
        {provider === 'apple' && (
          <SwitchContainer
            title="Enable POI search"
            value={enablePOISearching}
            onValueChange={() => setEnablePOISearching(!enablePOISearching)}
          />
        )}
        <SwitchContainer
          title="Enable POIs"
          value={enablePOIs}
          onValueChange={() => setEnablePOIs(!enablePOIs)}
        />
        {provider === 'google' && (
          <SwitchContainer
            title="Clickable POIs"
            value={clickablePOIs}
            onValueChange={() => setClickablePOIs(!clickablePOIs)}
          />
        )}
        {provider === 'apple' && (
          <SwitchContainer
            title="Enable POI cafe filter"
            value={enablePOIFilter}
            onValueChange={() => {
              setEnablePOIFilter(!enablePOIFilter);
              if (enablePOIFilter) setPoiType([]);
              else setPoiType(['cafe']);
            }}
          />
        )}
        <SwitchContainer
          title="Fetch query completions (display in console)"
          value={enableQueryCompletions}
          onValueChange={() => setEnableQueryCompletions(!enableQueryCompletions)}
        />
        <TextInput
          style={styles.textInput}
          editable={enableQueryCompletions}
          onChangeText={async (text) => {
            onChangeText(text);
            await ref.current?.getSearchCompletions(text);
          }}
          placeholder="Search query"
          value={text}
        />
        <SwitchContainer
          title="Search Centrum Pompidou"
          value={enablePlaceSearch}
          onValueChange={() => {
            setEnablePlaceSearch(!enablePlaceSearch);
            if (!enablePlaceSearch) {
              if (provider === 'apple') {
                setPlaceToSearch(appleMapsSearchRequest);
              } else {
                setPlaceToSearch(googleMapsSearchRequest);
              }
            } else {
              setPlaceToSearch('');
            }
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  switchContainer: {
    padding: 20,
  },
  textInput: {
    height: 30,
    margin: 5,
    padding: 5,
    borderWidth: 0.5,
  },
});
