import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { useAccount, useSignMessage } from "wagmi";
import { Button } from "~/components/ui/button";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function GenerateMessageBtn() {
  const { signMessageAsync } = useSignMessage();
  const { address } = useAccount();
  const [domain, setDomain] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setDomain(window.location.host);
    setOrigin(window.location.origin);
  }, []);

  return (
    <>
      <Button
        variant="default"
        className="bg-primary"
        onClick={async () => {
          if (!address) return;
          const res = await fetch(`http://localhost:3001/nonce`);
          const nonce = await res.text();
          try {
            const message = new SiweMessage({
              domain,
              address,
              statement: "Sign in with Ethereum to the app.",
              uri: origin,
              version: "1",
              chainId: 1,
              nonce: nonce,
            });
            const signature = await signMessageAsync({
              message: message.prepareMessage(),
            });

            const res = await fetch("http://localhost:3001/verify", {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ message, signature }),
            });
            const data = await res.json();
            console.log(data);
          } catch (e: unknown) {}
        }}
      >
        Log In
      </Button>
      <ConnectButton label="Sign in" />
    </>
  );
}
