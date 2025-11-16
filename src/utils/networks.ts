export interface NetworkConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const ROOTSTOCK_NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'Rootstock Mainnet',
    chainId: 30,
    rpcUrl: 'https://public-node.rsk.co',
    explorer: 'https://explorer.rsk.co',
    nativeCurrency: {
      name: 'Smart Bitcoin',
      symbol: 'RBTC',
      decimals: 18
    }
  },
  testnet: {
    name: 'Rootstock Testnet',
    chainId: 31,
    rpcUrl: 'https://public-node.testnet.rsk.co',
    explorer: 'https://explorer.testnet.rsk.co',
    nativeCurrency: {
      name: 'Test Smart Bitcoin',
      symbol: 'tRBTC',
      decimals: 18
    }
  }
};

export function getNetworkConfig(network: 'mainnet' | 'testnet'): NetworkConfig {
  return ROOTSTOCK_NETWORKS[network];
}
