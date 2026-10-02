# CipherLab

An interactive web app that shows how classical ciphers work, one step at a time. Type a message, pick a cipher and a key, and watch each letter being encrypted or decrypted. Then switch sides and break the cipher the way an attacker would.

It runs entirely in the browser. There is no backend: every cipher is plain TypeScript logic.

## What it covers

The ciphers follow a university lecture on traditional symmetric-key ciphers (Forouzan, chapter 3).

| Family | Ciphers |
|---|---|
| Monoalphabetic substitution | Additive (Caesar/shift), multiplicative, affine, substitution table |
| Polyalphabetic substitution | Autokey, Playfair, Vigenère |
| Transposition | Rail fence, columnar, keyed (permutation key) |

Attacks:

- **Brute force** on the additive, multiplicative and affine ciphers: every key is tried and the most English-looking result is marked.
- **Statistical attack** on the additive and substitution ciphers: a letter-frequency chart of the ciphertext next to typical English.

Other features: play, pause and step controls, keyboard shortcuts (arrow keys and space), the lecture's worked examples as one-click presets, light and dark themes, and a layout that works on phones.

## Run it locally

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
```

```bash
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs the tests, which check every cipher against the lecture's worked examples |
| `npm run build` | Type-checks the code and builds the site into `dist/` |
| `npm run preview` | Serves the built site locally |

## How the code is organised

```
src/
  ciphers/          The cipher logic. No React here, only functions.
    types.ts        The shapes of the data every cipher returns
    util.ts         Small helpers: mod, letter <-> number, key checks
    additive.ts     One file per cipher ...
    index.ts        The list of all ciphers
    ciphers.test.ts Tests against the lecture examples
  attacks/
    attacks.ts      Brute force, letter counting, English scoring
  hooks/
    usePlayer.ts    Keeps track of the current step and the play timer
  components/
    views/          One visual for each kind of cipher (see below)
    AttackPanel.tsx The "Break it" tab
    FrequencyChart.tsx
    PlayerControls.tsx, KeyInputs.tsx, Sidebar.tsx, ui.tsx, Icons.tsx
  App.tsx           The page: holds the state and puts the pieces together
  index.css         Colours for light and dark mode
```

### The main idea: a cipher returns a "trace"

A normal encrypt function returns only the answer. Here, each cipher's `run` function returns a **trace**: the answer plus the list of small steps that produced it.

```ts
const trace = additive.run('hello', { k: '15' }, 'encrypt');
trace.output;   // "WTAAD"
trace.steps[0]; // { inChar: 'h', calc: '(07 + 15) mod 26 = 22', outChar: 'W', ... }
```

The UI never does any cipher maths. It only draws `trace.steps` up to the current step. That separation is why the logic can be tested without a browser.

### Four views for ten ciphers

Each trace says which view draws it:

| `trace.view` | Component | Used by |
|---|---|---|
| `strip` | `StripView` | Additive, multiplicative, affine, substitution, autokey, Vigenère |
| `playfair` | `PlayfairView` | Playfair |
| `grid` | `GridView` | Rail fence, columnar |
| `permutation` | `PermutationView` | Keyed transposition |

### How data flows through React

1. `App.tsx` holds the state: which cipher, the message, the key, and encrypt or decrypt.
2. When any of those change, `App` calls `cipher.run(...)` to get a new trace.
3. The `usePlayer` hook holds one number, `step`: how many steps have been shown.
4. `App` passes `trace` and `step` down to the view, which draws the picture for that step.

Pressing play only changes `step`. React redraws the view each time it does.

### Adding a cipher

1. Create `src/ciphers/yourCipher.ts` that exports a `Cipher` object (copy `additive.ts` as a starting point).
2. Add it to the list in `src/ciphers/index.ts`.
3. Add its worked examples to `ciphers.test.ts`.

If it fits one of the four existing views, there is nothing else to do: it appears in the sidebar with a working step-through.

## Deploying for free

The build output is a folder of static files, so any static host works.

**Vercel:** push the project to GitHub, go to vercel.com, choose "Add New Project" and import the repository. Vercel detects Vite and fills in the settings. Every push to GitHub redeploys the site.

**Netlify:** same idea. Import the repository at netlify.com. If asked, the build command is `npm run build` and the publish directory is `dist`.

## Notes

- Conventions follow the lecture: plaintext is lowercase, ciphertext is uppercase, and everything except the letters a to z is dropped.
- The lecture's Example 3.13 prints a ciphertext that is one letter short (it skips the last "e" of "message"). The app gives the full 45-letter answer.
- These ciphers are for learning. All of them can be broken, and none should protect real data.

## Built with

React, TypeScript, Vite, Tailwind CSS, Motion (animation) and Vitest (tests).
