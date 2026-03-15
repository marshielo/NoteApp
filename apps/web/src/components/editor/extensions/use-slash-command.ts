'use client';

import { useState, useCallback } from 'react';

interface SlashState {
  isOpen: boolean;
  x: number;
  y: number;
  triggerPos: number;
}

export function useSlashCommand() {
  const [slashState, setSlashState] = useState<SlashState>({
    isOpen: false,
    x: 0,
    y: 0,
    triggerPos: 0,
  });

  const openSlash = useCallback((x: number, y: number, triggerPos: number) => {
    setSlashState({ isOpen: true, x, y, triggerPos });
  }, []);

  const closeSlash = useCallback(() => {
    setSlashState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleSlashKeyDown = useCallback(
    (event: KeyboardEvent): boolean => {
      if (!slashState.isOpen) return false;

      if (event.key === 'Escape') {
        closeSlash();
        return true;
      }

      return false;
    },
    [slashState.isOpen, closeSlash]
  );

  return { slashState, openSlash, closeSlash, handleSlashKeyDown };
}
