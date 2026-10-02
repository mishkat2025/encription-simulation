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
        <span className="mb-1.5 block text-xs font-medium text-ink-2">Topic</span>
        <select
          value={current.id}
          onChange={(event) => {
            window.location.hash = event.target.value;
          }}
          className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
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

      <div className="sticky top-6 hidden space-y-5 lg:block">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-1.5 px-3 text-xs font-medium text-ink-2">{section.title}</h2>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {section.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    aria-current={item.id === current.id ? 'page' : undefined}
                    className={cx(
                      'block rounded-lg px-3 py-2 text-sm no-underline transition-colors',
                      item.id === current.id ? 'bg-accent font-medium text-on-accent' : 'text-ink hover:bg-sunken',
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
