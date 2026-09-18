/**
 * If you have Giphy.com API key, you can use this functionality to fetch gif ID's
 */

const GIPHY_API_KEY = 'your API key for giphy.com';

// this is only partial type
// see https://developers.giphy.com/docs/api/endpoint
type GiphyResponse = {
  data: {
    id: string;
  }[];
};

/**
 * Queries Giphy.com API to search for GIF files
 * see https://developers.giphy.com/docs/api/endpoint
 */
export async function findGifs(phrase: string) {
  const searchRequest = {
    api_key: GIPHY_API_KEY,
    q: phrase.trim(),
  };

  try {
    const response = await fetch('https://api.giphy.com/v1/gifs/search', {
      method: 'POST',
      body: JSON.stringify(searchRequest),
    });
    const { data }: GiphyResponse = await response.json();

    // this is not the recommended way, but for simplicity we need only GIF IDs
    // to paste them into content URLs. Normally we should use URLs provided by this response
    return data.map(item => item.id);
  } catch (e) {
    console.error('Unable to search for gifs', e);
    return [];
  }
}
