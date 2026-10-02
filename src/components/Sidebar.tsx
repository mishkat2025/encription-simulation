import { topics, type Topic } from '../topics';
import { cx } from './ui';

/** The topics of one area, grouped under their headings in the order they are listed. */
function sectionsFor(area: Topic['area']) {
  const inArea = topics.filter((topic) => topic.area === area);
  return [...new Set(inArea.map((topic) => topic.group))].map((group) => ({
    title: group,
    items: inArea.filter((topic) => topic.group === group),
  }));
}

/**
 * The list of topics in the current area. Each entry is a plain link to
 * "#topic-id": the App component listens for the address changing and shows
 * that topic. On small screens the list becomes a dropdown.
 */
export function Sidebar({ current }: { current: Topic }) {
  const sections = sectionsFor(current.area);
  return (
    <nav aria-label="Topics">
      <label className="block lg:hidden">
        <span className="mb-1.5 block text-xs font-semibold tracking-wider text-muted uppercase">Topic</span>
        <select
          value={current.id}
          onChange={(event) => {
            window.location.hash = event.target.value;
          }}
          className="h-10 w-full rounded-lg border border-line-strong bg-sunken px-3 text-sm text-ink"
        >
          {sections.map((section) => (
            <optgroup key={section.title} label={section.title}>
              {section.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="scroll-thin sticky top-24 hidden max-h-[calc(100vh-7rem)] space-y-6 overflow-y-auto pr-1 pb-4 lg:block">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted uppercase">{section.title}</h2>
            <ul className="m-0 list-none space-y-0.5 border-l border-line p-0">
              {section.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={item.id === current.id ? 'page' : undefined}
                    className={cx(
                      '-ml-px block border-l-2 py-1.5 pr-2 pl-3 text-sm no-underline transition-colors',
                      item.id === current.id
                        ? 'border-accent-ink bg-accent-soft font-semibold text-ink'
                        : 'border-transparent text-ink-2 hover:border-line-strong hover:text-ink',
                    )}
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
