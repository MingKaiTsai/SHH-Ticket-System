"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("demoRole");
    router.replace(role ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
