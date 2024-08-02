import { useColorScheme as useRNColorScheme } from 'react-native'
import { useState, useEffect } from 'react'

export function useColorScheme() {
  // NOTE: The default React Native styling doesn't support server rendering.
  // Server rendered styles should not change between the first render of the HTML
  // and the first render on the client. So, we need to ensure that the color scheme
  // is only determined on the client side after hydration. This way, we avoid any
  // mismatch in styles that could occur if the server-rendered styles were different
  // from the client-rendered styles.
  const hasHydrated = useHasHydrated()

  const colorScheme = useRNColorScheme()

  if (hasHydrated) return colorScheme
  return 'light'
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  return hasHydrated
}
