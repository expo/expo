import React from 'react';
import { Picker } from 'react-native';

import Services from '../constants/Services';
import ServiceContext from '../context/ServiceContext';

const items = Object.keys(Services);

export default function ServicePicker() {
  const { service, setService } = React.useContext(ServiceContext);
  return (
    <Picker
      selectedValue={service}
      style={{ maxHeight: 150, flex: 1 }}
      onValueChange={itemValue => {
        setService(itemValue);
      }}>
      {items.map(item => (
        <Picker.Item label={item} value={item} key={item} />
      ))}
    </Picker>
  );
}
