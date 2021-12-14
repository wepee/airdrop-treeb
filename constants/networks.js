export const NETWORKS = {
  TestnetParams: {
    chainName: 'Fantom testnet',
    chainId: '0xfa2',
    rpcUrls: 'https://rpc.testnet.fantom.network/',
    nativeCurrency: {
      name: 'FTM test',
      symbol: 'FTM', // 2-6 characters long
      decimals: 18
    }
  },
  ftmParams: {
    chainName: 'Fantom Opera',
    chainId: '0xfa',
    rpcUrls: ['https://rpc.ftm.tools/'],
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM', // 2-6 characters long
      decimals: 18
    }
  }
}
