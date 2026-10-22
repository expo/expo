export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  duration: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  songs: Song[];
}

export interface Station {
  id: string;
  name: string;
  description: string;
  artwork: string;
  color: string;
}

export const CURRENT_TRACK: Song = {
  id: '1',
  title: 'Midnight City',
  artist: 'M83',
  album: "Hurry Up, We're Dreaming",
  artwork: 'https://picsum.photos/seed/midnight-city/300/300',
  duration: 244,
};

export const RECENTLY_PLAYED: Album[] = [
  {
    id: 'a1',
    title: 'After Hours',
    artist: 'The Weeknd',
    artwork: 'https://picsum.photos/seed/after-hours/300/300',
    songs: [],
  },
  {
    id: 'a2',
    title: 'Random Access Memories',
    artist: 'Daft Punk',
    artwork: 'https://picsum.photos/seed/daft-punk/300/300',
    songs: [],
  },
  {
    id: 'a3',
    title: 'In Rainbows',
    artist: 'Radiohead',
    artwork: 'https://picsum.photos/seed/in-rainbows/300/300',
    songs: [],
  },
  {
    id: 'a4',
    title: 'OK Computer',
    artist: 'Radiohead',
    artwork: 'https://picsum.photos/seed/ok-computer/300/300',
    songs: [],
  },
  {
    id: 'a5',
    title: 'Discovery',
    artist: 'Daft Punk',
    artwork: 'https://picsum.photos/seed/discovery/300/300',
    songs: [],
  },
];

export const TOP_PICKS: Album[] = [
  {
    id: 'a6',
    title: 'Currents',
    artist: 'Tame Impala',
    artwork: 'https://picsum.photos/seed/currents/300/300',
    songs: [],
  },
  {
    id: 'a7',
    title: 'Blonde',
    artist: 'Frank Ocean',
    artwork: 'https://picsum.photos/seed/blonde/300/300',
    songs: [],
  },
  {
    id: 'a8',
    title: 'IGOR',
    artist: 'Tyler, The Creator',
    artwork: 'https://picsum.photos/seed/igor/300/300',
    songs: [],
  },
  {
    id: 'a9',
    title: 'To Pimp a Butterfly',
    artist: 'Kendrick Lamar',
    artwork: 'https://picsum.photos/seed/tpab/300/300',
    songs: [],
  },
  {
    id: 'a10',
    title: 'Channel Orange',
    artist: 'Frank Ocean',
    artwork: 'https://picsum.photos/seed/channel-orange/300/300',
    songs: [],
  },
];

export const FEATURED_ALBUM: Album = {
  id: 'featured',
  title: "Hurry Up, We're Dreaming",
  artist: 'M83',
  artwork: 'https://picsum.photos/seed/m83-hurry/600/600',
  songs: [
    {
      id: '1',
      title: 'Midnight City',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      artwork: 'https://picsum.photos/seed/m83-hurry/300/300',
      duration: 244,
    },
    {
      id: '10',
      title: 'Intro',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      artwork: 'https://picsum.photos/seed/m83-hurry/300/300',
      duration: 120,
    },
    {
      id: '11',
      title: 'Reunion',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      artwork: 'https://picsum.photos/seed/m83-hurry/300/300',
      duration: 378,
    },
    {
      id: '12',
      title: 'Wait',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      artwork: 'https://picsum.photos/seed/m83-hurry/300/300',
      duration: 324,
    },
    {
      id: '13',
      title: 'Raconte-Moi Une Histoire',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      artwork: 'https://picsum.photos/seed/m83-hurry/300/300',
      duration: 228,
    },
  ],
};

export const BROWSE_CATEGORIES = [
  {
    id: 'c1',
    name: 'Spatial Audio',
    color: '#5856D6',
    icon: 'airpodspro' as const,
  },
  {
    id: 'c2',
    name: 'New Releases',
    color: '#FF3B30',
    icon: 'star.fill' as const,
  },
  {
    id: 'c3',
    name: 'Charts',
    color: '#FF9500',
    icon: 'chart.line.uptrend.xyaxis' as const,
  },
  {
    id: 'c4',
    name: 'Music Videos',
    color: '#34C759',
    icon: 'play.rectangle.fill' as const,
  },
  { id: 'c5', name: 'Genres', color: '#007AFF', icon: 'guitars.fill' as const },
  {
    id: 'c6',
    name: 'Moods',
    color: '#AF52DE',
    icon: 'face.smiling.inverse' as const,
  },
];

export const STATIONS: Station[] = [
  {
    id: 's1',
    name: 'Apple Music 1',
    description: 'The new music that matters.',
    artwork: 'https://picsum.photos/seed/am1/300/300',
    color: '#FC3C44',
  },
  {
    id: 's2',
    name: 'Apple Music Hits',
    description: 'Songs you know and love.',
    artwork: 'https://picsum.photos/seed/amhits/300/300',
    color: '#8C8C8C',
  },
  {
    id: 's3',
    name: 'Apple Music Country',
    description: 'Where it sounds like home.',
    artwork: 'https://picsum.photos/seed/amcountry/300/300',
    color: '#B4926A',
  },
  {
    id: 's4',
    name: 'Classical',
    description: 'The world of classical music.',
    artwork: 'https://picsum.photos/seed/classical/300/300',
    color: '#5856D6',
  },
  {
    id: 's5',
    name: 'Chill',
    description: 'Music to help you unwind.',
    artwork: 'https://picsum.photos/seed/chill/300/300',
    color: '#30B0C7',
  },
];

export const LIBRARY_SONGS: Song[] = [
  {
    id: '20',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    artwork: 'https://picsum.photos/seed/after-hours/300/300',
    duration: 200,
  },
  {
    id: '21',
    title: 'Get Lucky',
    artist: 'Daft Punk',
    album: 'Random Access Memories',
    artwork: 'https://picsum.photos/seed/daft-punk/300/300',
    duration: 369,
  },
  {
    id: '22',
    title: 'Let It Happen',
    artist: 'Tame Impala',
    album: 'Currents',
    artwork: 'https://picsum.photos/seed/currents/300/300',
    duration: 467,
  },
  {
    id: '23',
    title: 'Nikes',
    artist: 'Frank Ocean',
    album: 'Blonde',
    artwork: 'https://picsum.photos/seed/blonde/300/300',
    duration: 314,
  },
  {
    id: '24',
    title: 'NEW MAGIC WAND',
    artist: 'Tyler, The Creator',
    album: 'IGOR',
    artwork: 'https://picsum.photos/seed/igor/300/300',
    duration: 195,
  },
  {
    id: '25',
    title: 'Alright',
    artist: 'Kendrick Lamar',
    album: 'To Pimp a Butterfly',
    artwork: 'https://picsum.photos/seed/tpab/300/300',
    duration: 219,
  },
  {
    id: '26',
    title: 'Everything In Its Right Place',
    artist: 'Radiohead',
    album: 'Kid A',
    artwork: 'https://picsum.photos/seed/kid-a/300/300',
    duration: 250,
  },
  {
    id: '27',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    artwork: 'https://picsum.photos/seed/starboy/300/300',
    duration: 230,
  },
];

export const SEARCH_CATEGORIES = [
  { id: 'sc1', name: 'Pop', color: '#FF2D55' },
  { id: 'sc2', name: 'Hip-Hop', color: '#FF9500' },
  { id: 'sc3', name: 'Rock', color: '#5856D6' },
  { id: 'sc4', name: 'Electronic', color: '#30B0C7' },
  { id: 'sc5', name: 'R&B/Soul', color: '#AF52DE' },
  { id: 'sc6', name: 'Alternative', color: '#34C759' },
  { id: 'sc7', name: 'Classical', color: '#007AFF' },
  { id: 'sc8', name: 'Jazz', color: '#FF3B30' },
  { id: 'sc9', name: 'Country', color: '#B4926A' },
  { id: 'sc10', name: 'Indie', color: '#5AC8FA' },
  { id: 'sc11', name: 'K-Pop', color: '#FF2D55' },
  { id: 'sc12', name: 'Latin', color: '#FF9500' },
];
