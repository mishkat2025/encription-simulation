import type { Player } from '../hooks/usePlayer';
import { EndIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, RestartIcon } from './Icons';
import { Button } from './ui';

const SPEEDS = [0.5, 1, 2, 4];

/** Play, pause, step and scrub through the steps. */
export function PlayerControls({ player }: { player: Player }) {
  const { step, total, playing } = player;
  const empty = total === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-1.5">
        <Button label="Back to the start" onClick={() => player.goTo(0)} disabled={empty || step === 0}>
          <RestartIcon />
        </Button>
        <Button label="Previous step (left arrow)" onClick={player.previous} disabled={empty || step === 0}>
          <PrevIcon />
        </Button>
        <Button primary label={playing ? 'Pause (space)' : 'Play (space)'} onClick={player.toggle} disabled={empty}>
          {playing ? <PauseIcon /> : <PlayIcon />}
          <span className="w-10 text-left">{playing ? 'Pause' : 'Play'}</span>
        </Button>
        <Button label="Next step (right arrow)" onClick={player.next} disabled={empty || step === total}>
          <NextIcon />
        </Button>
        <Button label="Skip to the end" onClick={() => player.goTo(total)} disabled={empty || step === total}>
          <EndIcon />
        </Button>
      </div>

      <input
        type="range"
        aria-label="Step"
        min={0}
        max={total}
        value={step}
        disabled={empty}
        onChange={(event) => player.goTo(Number(event.target.value))}
        className="h-9 min-w-32 flex-1 accent-(--ink)"
      />

      <span className="w-24 text-sm text-ink-2 tabular-nums">
        Step {step} of {total}
      </span>

      <label className="flex items-center gap-2 text-sm text-ink-2">
        Speed
        <select
          value={player.speed}
          onChange={(event) => player.setSpeed(Number(event.target.value))}
          className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-sm text-ink"
        >
          {SPEEDS.map((speed) => (
            <option key={speed} value={speed}>
              {speed}×
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
