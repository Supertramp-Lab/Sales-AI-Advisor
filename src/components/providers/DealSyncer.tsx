"use client";

import { useEffect, useRef } from "react";
import { useDealStore } from "@/store/dealStore";
import type { Deal } from "@/types";

export function DealSyncer() {
  const { deals, isLoaded, loadDeals } = useDealStore();
  const prevRef = useRef<Deal[]>([]);

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      prevRef.current = deals;
      return;
    }
    const prev = prevRef.current;

    deals.forEach((deal) => {
      const old = prev.find((d) => d.id === deal.id);
      if (old === undefined) {
        fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deal),
        });
      } else if (old !== deal) {
        fetch(`/api/deals/${deal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(deal),
        });
      }
    });

    prevRef.current = deals;
  }, [deals, isLoaded]);

  return null;
}
