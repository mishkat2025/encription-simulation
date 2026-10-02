// The frame around every page: header, sidebar and footer. It reads the topic
// from the address bar (for example #vigenere or #rsa) and shows that page.

import { useEffect, useState } from 'react';
import { CipherPage } from './components/CipherPage';
import { MoonIcon, SunIcon } from './components/Icons';
import { Sidebar } from './components/Sidebar';
import { Button } from './components/ui';
import { ciphers, findCipher } from './ciphers';
import { findLab } from './labs';

/** The topic named in the address bar, or the first cipher when there is none. */
function topicFromAddress(): string {
  const id = window.location.hash.slice(1);
  return findCipher(id) || findLab(id) ? id : ciphers[0].id;
}

export default function App() {
  const [topicId, setTopicId] = useState(topicFromAddress);

  // The sidebar links change the address. Listening for that change means the
  // browser's back and forward buttons work too.
  useEffect(() => {
    const onAddressChange = () => {
      setTopicId(topicFromAddress());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onAddressChange);
    return () => window.removeEventListener('hashchange', onAddressChange);
  }, []);

  const cipher = findCipher(topicId);
  const lab = findLab(topicId);

  return (
    <div className="min-h-screen">
      <Header />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Sidebar currentId={topicId} />

        {/* key={topicId} gives every topic a fresh page, so no state leaks from one to the next. */}
        <main key={topicId} className="min-w-0 space-y-4">
          {cipher && <CipherPage cipher={cipher} />}
          {lab && <lab.component />}
        </main>
      </div>

      <footer className="mx-auto max-w-7xl px-4 pt-4 pb-10 text-xs leading-relaxed text-ink-2">
        CS² for Everyone: computer science concept simulations. The classical ciphers here can all be broken, and the
        modern algorithms are shown with small numbers so the steps fit on a page. None of it should protect real
        data.
      </footer>
    </div>
  );
}

function Header() {
  const [dark, setDark] = useState(() => {
    const saved = document.documentElement.dataset.theme;
    return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Storage can be blocked (private windows). The theme still changes for this visit.
    }
    setDark(!dark);
  };

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <a href={`#${ciphers[0].id}`} className="flex items-center gap-3 text-ink no-underline">
          <img src="/favicon.svg" alt="" width="28" height="28" />
          <span>
            <span className="block text-base leading-tight font-semibold">CS² for Everyone</span>
            <span className="block text-xs text-ink-2">Computer science concepts, one step at a time</span>
          </span>
        </a>
        <Button onClick={toggleTheme} label={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </Button>
      </div>
    </header>
  );
}
