import { useRef, useCallback } from "react"

// Custom hook for throttling
export default function useThrottle(callback, delay) {
    const lastCall = useRef(0)
    const lastCallTimer = useRef()
  
    return useCallback((...args) => {
      const now = Date.now()
      if (now - lastCall.current >= delay) {
        callback(...args)
        lastCall.current = now
      } else {
        clearTimeout(lastCallTimer.current)
        lastCallTimer.current = setTimeout(() => {
          callback(...args)
          lastCall.current = Date.now()
        }, delay)
      }
    }, [callback, delay])
  }