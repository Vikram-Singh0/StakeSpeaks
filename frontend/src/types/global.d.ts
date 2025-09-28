// Global type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, callback: (data: unknown) => void) => void
      removeListener?: (event: string, callback: (data: unknown) => void) => void
      selectedAddress?: string
      chainId?: string
    }
  }
}

export {}