import processColor from 'react-native/Libraries/StyleSheet/processColor'

export default function processTheme(theme = {}) {
  return Object.keys(theme).reduce((result, key) => {
    let value = theme[key]
    if (key.toLowerCase().endsWith('color')) {
      value = processColor(value)
    }
    return { ...result, [key]: value }
  }, {})
}
