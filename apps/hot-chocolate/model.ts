export { data as FlavourList } from './assets/FlavourList.json';
export { data as LocationList } from './assets/LocationList.json';

export interface Flavour {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  stores: Store[];
}

export interface Store {
  address: string;
  hours: string;
  point: [number, number];
  name: string;
}
