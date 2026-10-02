import { useEffect, useState } from 'react';

/**
 * Keeps track of how far through the steps we are, and plays them on a timer.
 *
 * `step` counts the steps that have been completed: 0 means nothing has
 * happened yet, and `total` means the whole message is done.
 * `resetKey` is any value that changes when the steps change (the trace);
 * the player goes back to the start whenever it does.
 */
export function usePlayer(total: number, resetKey: unknown) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // New message or key: start again from the beginning.
  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [resetKey]);

  // While playing, move one step forward on every tick.
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, total)), 1000 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, total]);

  // Stop the timer once the last step has been shown.
  useEffect(() => {
    if (playing && step >= total) setPlaying(false);
  }, [playing, step, total]);

  return {
    step: Math.min(step, total),
    total,
    playing,
    speed,
    setSpeed,
    goTo: (target: number) => {
      setPlaying(false);
      setStep(Math.max(0, Math.min(target, total)));
    },
    next: () => {
      setPlaying(false);
      setStep((s) => Math.min(s + 1, total));
    },
    previous: () => {
      setPlaying(false);
      setStep((s) => Math.max(s - 1, 0));
    },
    toggle: () => {
      if (playing) {
        setPlaying(false);
      } else {
        // Pressing play at the end starts again from the beginning.
        if (step >= total) setStep(0);
        setPlaying(true);
      }
    },
  };
}

export type Player = ReturnType<typeof usePlayer>;

/** Keyboard shortcuts for a player: arrow keys to step, space to play or pause. */
export function usePlayerKeys(player: Player, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // Leave the keys alone while the user is typing or using a control.
      if ((event.target as HTMLElement).closest('input, textarea, select, button, summary')) return;
      if (event.key === 'ArrowRight') player.next();
      else if (event.key === 'ArrowLeft') player.previous();
      else if (event.key === ' ') {
        event.preventDefault();
        player.toggle();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });
}
