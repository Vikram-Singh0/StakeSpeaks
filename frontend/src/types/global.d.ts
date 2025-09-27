// Global type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, callback: (data: any) => void) => void
      removeListener?: (event: string, callback: (data: any) => void) => void
      selectedAddress?: string
      chainId?: string
    }
  }
}

export {}