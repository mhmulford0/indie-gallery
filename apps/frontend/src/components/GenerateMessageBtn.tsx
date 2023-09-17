import { useState, useEffect } from "react";
import { SiweMessage } from "siwe";
import { useSignMessage, useAccount } from "wagmi";

export default function GenerateMessageBtn() {
  const {
    data: signMessageData,
    error,
    isLoading,
    signMessageAsync,
    variables,
  } = useSignMessage();
  const { address } = useAccount();
  const [domain, setDomain] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setDomain(window.location.host);
    setOrigin(window.location.origin);
  }, []);

  return (
    <button
      className="w-64 bg-slate-600"
      onClick={async () => {
        if (!address) return;
        const res = await fetch(`http://localhost:3001/nonce`);
        const nonce = await res.text();
        try {
          const message = new SiweMessage({
            domain: window.location.host,
            address,
            statement: "Sign in with Ethereum to the app.",
            uri: window.location.origin,
            version: "1",
            chainId: 1,
            nonce: nonce,
          });
          const signature = await signMessageAsync({
            message: message.prepareMessage(),
          });

          const res = await fetch("http://localhost:3001/verify", {
            method: "POST",
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
      Generate Message
    </button>
  );
}
