import { type AppType } from "next/app";

import "~/styles/globals.css";

import "@rainbow-me/rainbowkit/styles.css";

import {
  darkTheme,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { mainnet } from "wagmi/chains";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

if (!process.env.NEXT_PUBLIC_ALCHEMY_ID) {
  throw new Error("Please supply api key");
}

const { chains, publicClient } = configureChains(
  [mainnet],
  [
    alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_ID }),
    publicProvider(),
  ],
);

const { connectors } = getDefaultWallets({
  appName: "Gallery",
  projectId: "dd78716fb7c73961f4f3fede8139b615",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme()}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default MyApp;
