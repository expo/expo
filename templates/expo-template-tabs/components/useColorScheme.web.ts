import { useColorScheme as useRNColorScheme } from 'react-native'
import { useState, useEffect } from 'react'

export function useColorScheme() {
  // Server rendered content and the content on first render on the clien must be same.
  // So, we need to ensure that the color scheme is only determined on the client side
  // after hydration in order to avoid style mismatches between server-rendered and
  // client-rendered content.
  const hasHydrated = useHasHydrated()

  const colorScheme = useRNColorScheme()

  if (hasHydrated) return colorScheme
  return 'light'
}

export const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  return hasHydrated
}
