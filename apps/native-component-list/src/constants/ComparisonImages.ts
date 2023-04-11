import { ImageSource } from 'expo-image';

type ComparisonImage = {
  source: ImageSource;
  blurhash: ImageSource;
  thumbhash: string;
  showGrid?: boolean;
};
export const comparisonImages: ComparisonImage[] = [
  {
    source: { uri: 'https://picsum.photos/seed/175/300/200' },
    blurhash: {
      blurhash: 'WgF}G?az0fs.x[jat7xFRjNHt6s.4;oe-:RkVtkCi^Nbo|xZRjWB',
      width: 18,
      height: 12,
    },
    thumbhash: '1EgOHYQImHiZZ4iCe3eWeAinolA8',
  },
  {
    source: { uri: 'https://picsum.photos/seed/picsum/200/300' },
    blurhash: { blurhash: 'LmLg9W-oNGt7~Cs.ofWC4:RkfRR*', width: 18, height: 12 },
    thumbhash: '5xcSHQZpeI94KIenaHhoh2ufo/Y4',
  },
  {
    source: { uri: 'https://picsum.photos/seed/8/200/300' },
    blurhash: { blurhash: 'LMBDA}MxIoV@pyM{V?WUKmV?wHoz', width: 18, height: 12 },
    thumbhash: 'EQgKHQZlh2122Hb4dm2Gh2hwkQc3',
  },
  {
    source: require('../../assets/images/exponent-icon.png'),
    blurhash: { blurhash: 'LnNU9mj[%1j[a#ay~UoL-ofQRkj[', width: 18, height: 12 },
    thumbhash: 'GTSBBIAmOIlphnApR+P7ijmPhYUIR4h3Bg',
    showGrid: true,
  },
  {
    source: { uri: 'https://picsum.photos/seed/13/200/300' },
    blurhash: {
      blurhash: 'W~LgtpoJRkWBWCa}?wjtayayayj[A0WXofofj[jsIUoea#j[j[ay',
      width: 18,
      height: 12,
    },
    thumbhash: 'JRkaPQh4d394V4doeHd3h3iAgAcI',
  },
  {
    source: { uri: 'https://picsum.photos/id/237/200/300' },
    blurhash: {
      blurhash: 'WRB:KZbH%LxaoeNGIpR*IoWBs:oL~UWVt6t6WBWB%1ofs:j[t6WV',
      width: 18,
      height: 12,
    },
    thumbhash: 'TwgOFQKniXV1+JeYh3u2mLZ1b1v3',
  },
  {
    source: { uri: 'https://picsum.photos/id/705/200/300' },
    blurhash: {
      blurhash: 'WTKcFK$e%1r=ofjs~9S2I;e:fkWC0hItIqW;WCWCD-IW%0xZj@oe',
      width: 18,
      height: 12,
    },
    thumbhash: 'YGkKHQKnh392CGdXpXVoeptu0IgF',
  },
  {
    source: { uri: 'https://picsum.photos/id/857/200/300' },
    blurhash: {
      blurhash: 'Wg9@h@xaWBaxbGbHPEX9aef5jaj[FNW?n$jFjbj]s,j[jFe.WVWr',
      width: 18,
      height: 12,
    },
    thumbhash: 'E9cJVRB6h493R3iIeHmXZ3hwhAg3',
  },
];
