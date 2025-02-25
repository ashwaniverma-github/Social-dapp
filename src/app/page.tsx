"use client";
import WalletConnectBtn from "@/sm-components/WalletConnectBtn";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HomePage from "@/components/Homepage";
import Feed from "@/components/Feed";
export default function Home() {
  const { connected } = useWallet();
  const router = useRouter();

  useEffect(() => {
    if (connected) {
      router.push('/dashboard');
    }
  }, [connected, router]); // Proper dependency array

  return (
    <div className="min-h-screen">
      <HomePage/>
      <Feed/>
    </div>
  );
}