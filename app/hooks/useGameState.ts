"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createInitialState,
  advanceToNextPayday as engineAdvance,
  collectPaycheck as engineCollect,
  applyPayment as enginePay,
  payEverything as enginePayAll,
  type GameState,
} from "../game/engine";

const STORAGE_KEY = "ja-credit-game-v2";

const isValidSave = (value: unknown): value is GameState => {
  if (typeof value !== "object" || value === null) return false;
  const s = value as GameState;
  return (
    typeof s.day === "number" &&
    typeof s.money === "number" &&
    Array.isArray(s.cards) &&
    s.cards.every(
      (c) => typeof c?.balance === "number" && typeof c?.id === "string",
    ) &&
    Array.isArray(s.snapshots)
  );
};

export const useGameState = () => {
  // Always start from the initial state so server and client render identically;
  // any saved game is restored after mount.
  const [state, setState] = useState<GameState>(createInitialState);
  const [hydrated, setHydrated] = useState(false);
  const skippedSave = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isValidSave(parsed)) setState(parsed);
      }
    } catch {
      // corrupted save — start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || skippedSave.current) {
      skippedSave.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable (private mode etc.) — the game still plays
    }
  }, [state, hydrated]);

  const makePayment = useCallback((cardId: string, cents: number) => {
    setState((prev) => enginePay(prev, cardId, cents));
  }, []);

  const payEverything = useCallback(() => {
    setState((prev) => enginePayAll(prev));
  }, []);

  const collectPaycheck = useCallback((cents: number) => {
    setState((prev) => engineCollect(prev, cents));
  }, []);

  const advanceToPayday = useCallback(() => {
    setState((prev) => engineAdvance(prev));
  }, []);

  const resetGame = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState(createInitialState());
  }, []);

  return {
    state,
    hydrated,
    makePayment,
    payEverything,
    collectPaycheck,
    advanceToPayday,
    resetGame,
  };
};
