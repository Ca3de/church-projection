import { useEffect, useMemo, useRef, useState } from 'react';
import { parseHymnText, suggestTitle, hymnToText, type ParsedStanza } from '../services/hymnParser';
import {
  addCustomHymn,
  deleteCustomHymn,
  getCustomHymnsList,
  getBuiltInHymn,
  getHymnByNumber,
  exportCustomHymns,
  importCustomHymns,
  formatHymnLabel,
} from '../services/hymnService';
import { HYMN_BOOKS, hymnIdentity, printedNumber } from '../data/hymnBooks';
import type { Hymn, HymnBookId } from '../types/hymn';

const BOOK_KEY = 'church-projection-hymn-book';

interface HymnManagerProps {
  onClose: () => void;
  /** Project a hymn straight after saving it */
  onDisplayHymn?: (hymnNumber: number) => void;
}

type Message = { kind: 'success' | 'error'; text: string; hymnNumber?: number };

/** "Hymn 788", "YS1", "IOM 15", or "" for an unnumbered hymn */
function labelFor(hymn: Pick<Hymn, 'number' | 'displayNumber' | 'unnumbered' | 'book'>): string {
  const label = formatHymnLabel(hymn);
  if (!label) return '';
  return (hymn.book ?? 'main') === 'main' && !hymn.displayNumber ? `Hymn ${label}` : label;
}

const inputStyle = { padding: '0.65rem 0.9rem', fontSize: '0.9375rem' } as const;
const textareaStyle = { padding: '0.85rem 1rem', fontSize: '0.875rem', lineHeight: 1.6 } as const;

export function HymnManager({ onClose, onDisplayHymn }: HymnManagerProps) {
  const [tab, setTab] = useState<'add' | 'saved'>('add');
  const [book, setBook] = useState<HymnBookId>(() => {
    const saved = localStorage.getItem(BOOK_KEY);
    return HYMN_BOOKS.some((b) => b.id === saved) ? (saved as HymnBookId) : 'main';
  });
  const [bookTouched, setBookTouched] = useState(false);
  const [numberInput, setNumberInput] = useState('');
  const [title, setTitle] = useState('');
  const [secondaryTitle, setSecondaryTitle] = useState('');
  const [text, setText] = useState('');
  const [secondaryText, setSecondaryText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingUnnumbered, setEditingUnnumbered] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [saved, setSaved] = useState<Hymn[]>(getCustomHymnsList);
  const fileRef = useRef<HTMLInputElement>(null);

  const isBilingual = book === 'iom';
  const dirty = text.trim() !== '' || secondaryText.trim() !== '';

  // ── Parse as they type ──
  const primary = useMemo(() => parseHymnText(text), [text]);
  const secondary = useMemo(
    () => (isBilingual && secondaryText.trim() ? parseHymnText(secondaryText) : null),
    [isBilingual, secondaryText]
  );

  // Blank fields fall back to the heading line, then to the first line
  const effectiveNumber = numberInput.trim() || primary.heading?.number || '';
  const autoTitle = primary.heading?.title || suggestTitle(primary.verses[0]?.split('\n')[0]);
  const effectiveTitle = title.trim() || autoTitle;
  const autoSecondaryTitle = primary.heading?.secondaryTitle || suggestTitle(secondary?.verses[0]?.split('\n')[0]);
  const effectiveSecondaryTitle = secondaryTitle.trim() || autoSecondaryTitle;

  const identity = hymnIdentity(book, effectiveNumber);
  const numberInvalid = effectiveNumber !== '' && !identity;
  const existing = identity ? getHymnByNumber(identity.number) : null;
  const replacing = existing && existing.number !== editingId ? existing : null;
  const canSave = primary.verses.length > 0 && !numberInvalid && effectiveTitle !== '';

  const savingAs = labelFor({
    number: identity?.number ?? 0,
    displayNumber: identity?.displayNumber,
    unnumbered: !identity,
    book,
  });

  // Translation checks — verses are paired in order, so a mismatch matters
  const pairingWarnings = useMemo(() => {
    if (!secondary || primary.verses.length === 0) return [];
    const out: string[] = [];
    if (secondary.verses.length !== primary.verses.length) {
      out.push(
        `English has ${primary.verses.length} verse${primary.verses.length === 1 ? '' : 's'} and Yorùbá has ${secondary.verses.length} — they are paired in order${
          secondary.verses.length > primary.verses.length ? ', so the extra Yorùbá verses will be left out' : ''
        }.`
      );
    }
    if (!!secondary.refrain !== !!primary.refrain) {
      out.push(primary.refrain ? 'The English has a chorus but the Yorùbá does not.' : 'The Yorùbá has a chorus but the English does not.');
    }
    return out;
  }, [primary, secondary]);

  // Preview rows, paired the same way they will be saved: verse with verse, chorus with chorus
  const rows = useMemo(() => {
    const secondaryVerses = secondary?.stanzas.filter((s) => s.kind === 'verse') ?? [];
    const secondaryRefrain = secondary?.stanzas.find((s) => s.kind === 'refrain');
    let verse = 0;
    return primary.stanzas.map((stanza) => {
      const isRefrain = stanza.kind === 'refrain';
      const pair: ParsedStanza | undefined = isRefrain ? secondaryRefrain : secondaryVerses[verse];
      if (!isRefrain) verse += 1;
      return { label: isRefrain ? (isBilingual ? 'Refrain · Egbe' : 'Refrain') : `Verse ${verse}`, stanza, pair };
    });
  }, [primary, secondary, isBilingual]);

  const resetForm = () => {
    setNumberInput('');
    setTitle('');
    setSecondaryTitle('');
    setText('');
    setSecondaryText('');
    setEditingId(null);
    setEditingUnnumbered(false);
    setBookTouched(false);
  };

  const requestClose = () => {
    if (dirty && !window.confirm('Discard the hymn you were adding?')) return;
    onClose();
  };

  // Escape closes — but never throws away a half-entered hymn
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dirty) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, onClose]);

  const handleTextChange = (value: string) => {
    setText(value);
    setMessage(null);
    // A heading such as "(IOM 15) …" picks the book, unless they chose one themselves
    if (!bookTouched && editingId === null) {
      const hint = parseHymnText(value.split('\n').find((l) => l.trim()) ?? '').heading?.bookHint;
      if (hint && hint !== book) setBook(hint);
    }
  };

  const chooseBook = (id: HymnBookId) => {
    setBook(id);
    setBookTouched(true);
    setMessage(null);
  };

  const loadForEditing = (hymn: Hymn) => {
    setBook(hymn.book ?? 'main');
    setBookTouched(true);
    setNumberInput(printedNumber(hymn));
    setTitle(hymn.title);
    setSecondaryTitle(hymn.secondaryTitle ?? '');
    setText(hymnToText(hymn.verses, hymn.refrain));
    setSecondaryText(hymn.secondaryVerses?.some(Boolean) ? hymnToText(hymn.secondaryVerses, hymn.secondaryRefrain) : '');
    setEditingId(hymn.number);
    setEditingUnnumbered(!!hymn.unnumbered);
    setMessage(null);
    setTab('add');
  };

  const handleSave = () => {
    if (!canSave) return;
    const id = identity
      ? identity.number
      : editingId !== null && editingUnnumbered
        ? editingId
        // eslint-disable-next-line react-hooks/purity -- runs on click, not during render
        : Date.now();

    const hymn: Hymn = {
      number: id,
      ...(identity?.displayNumber && { displayNumber: identity.displayNumber }),
      ...(!identity && { unnumbered: true }),
      book,
      title: effectiveTitle,
      ...(primary.author && { author: primary.author }),
      verses: primary.verses,
      refrain: primary.refrain,
      ...(secondary &&
        secondary.verses.length > 0 && {
          secondaryLanguage: 'Yorùbá',
          secondaryTitle: effectiveSecondaryTitle,
          secondaryVerses: primary.verses.map((_, i) => secondary.verses[i] ?? ''),
          secondaryRefrain: secondary.refrain,
        }),
    };

    // Renumbered while editing: the old entry goes
    if (editingId !== null && editingId !== id) deleteCustomHymn(editingId);
    addCustomHymn(hymn);
    setSaved(getCustomHymnsList());

    const label = labelFor(hymn);
    setMessage({ kind: 'success', text: `Saved ${label ? `${label} · ` : ''}${hymn.title}.`, hymnNumber: id });
    resetForm();
  };

  const handleDelete = (hymn: Hymn) => {
    const label = labelFor(hymn);
    const name = `${label ? `${label} · ` : ''}${hymn.title}`;
    const original = getBuiltInHymn(hymn.number);
    const question = original
      ? `Remove your changes to ${name}? The version that came with the app returns.`
      : `Delete ${name} from this computer?`;
    if (!window.confirm(question)) return;
    deleteCustomHymn(hymn.number);
    setSaved(getCustomHymnsList());
    if (editingId === hymn.number) resetForm();
    setMessage({ kind: 'success', text: original ? `Restored the original ${name}.` : `Deleted ${name}.` });
  };

  const handleBackup = () => {
    const blob = new Blob([exportCustomHymns()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sanctum-hymns-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleRestore = async (file: File) => {
    try {
      const count = importCustomHymns(await file.text());
      setSaved(getCustomHymnsList());
      setMessage({ kind: 'success', text: `Restored ${count} hymn${count === 1 ? '' : 's'} from the backup.` });
    } catch (err) {
      const text = err instanceof SyntaxError ? 'This file is not a Sanctum hymn backup.' : err instanceof Error ? err.message : 'Could not read that file.';
      setMessage({ kind: 'error', text });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const sortedSaved = useMemo(() => {
    const order = (h: Hymn) => HYMN_BOOKS.findIndex((b) => b.id === (h.book ?? 'main'));
    return [...saved].sort((a, b) => order(a) - order(b) || a.number - b.number);
  }, [saved]);

  // ── Pieces ──
  const messageLine = message && (
    <p
      className="text-sm flex flex-wrap items-center gap-x-3 gap-y-1"
      style={{ color: message.kind === 'success' ? 'rgb(134, 239, 172)' : 'rgb(252, 165, 165)' }}
      role="status"
    >
      <span>{message.text}</span>
      {message.kind === 'success' && message.hymnNumber !== undefined && onDisplayHymn && (
        <button
          type="button"
          onClick={() => onDisplayHymn(message.hymnNumber!)}
          className="underline underline-offset-4 decoration-1"
          style={{ color: 'var(--ink-100)' }}
        >
          Display it now
        </button>
      )}
    </p>
  );

  const tabButton = (id: 'add' | 'saved', label: string) => {
    const active = tab === id;
    return (
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={() => setTab(id)}
        className="relative pb-2 font-display uppercase transition-colors duration-300 focus:outline-none"
        style={{
          fontSize: '0.66rem',
          fontWeight: 500,
          letterSpacing: '0.2em',
          color: active ? 'var(--ink-100)' : 'var(--ink-40)',
        }}
      >
        {label}
        <span
          aria-hidden="true"
          className="absolute left-0 right-0 bottom-0 h-px"
          style={{
            background: 'var(--theme-accent)',
            transform: active ? 'scaleX(1)' : 'scaleX(0)',
            transition: 'transform 0.45s var(--ease-out)',
          }}
        />
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{
        background: 'rgba(5, 4, 3, 0.74)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.3s var(--ease-out) both',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hymn-editor-title"
    >
      <div
        className="panel w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden"
        style={{ background: 'rgba(17, 15, 13, 0.97)', animation: 'scaleIn 0.35s var(--ease-out) both' }}
      >
        {/* ── Header ── */}
        <div className="flex items-end gap-4 sm:gap-8 px-5 sm:px-7 pt-5 pb-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
          <div className="flex-1 min-w-0">
            <p className="eyebrow">Hymnbook</p>
            <h2
              id="hymn-editor-title"
              className="font-display text-lg sm:text-xl mt-1 truncate"
              style={{ letterSpacing: '0.08em', color: 'var(--ink-100)' }}
            >
              {tab === 'saved' ? 'Saved on this computer' : editingId !== null ? 'Edit hymn' : 'Add a hymn'}
            </h2>
          </div>
          <div role="tablist" className="flex gap-5 shrink-0">
            {tabButton('add', editingId !== null ? 'Edit' : 'Add')}
            {tabButton('saved', `Saved · ${saved.length}`)}
          </div>
          <button type="button" onClick={requestClose} className="btn-ghost shrink-0 -mr-2 mb-0.5" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {tab === 'add' ? (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid lg:grid-cols-2">
              {/* ── Form ── */}
              <div className="lg:min-h-0 lg:overflow-y-auto px-5 sm:px-7 py-5 space-y-5 lg:border-r" style={{ borderColor: 'var(--hairline)' }}>
                {/* Book */}
                <div className="flex items-center gap-1 flex-wrap -ml-2" role="radiogroup" aria-label="Hymnbook">
                  {HYMN_BOOKS.map((b, i) => {
                    const active = b.id === book;
                    return (
                      <span key={b.id} className="flex items-center">
                        {i > 0 && (
                          <span aria-hidden="true" className="mx-1 text-[9px]" style={{ color: 'var(--ink-20)' }}>
                            ◆
                          </span>
                        )}
                        <button
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => chooseBook(b.id)}
                          className="px-2 py-1.5 font-display uppercase transition-colors duration-300 focus:outline-none"
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 500,
                            letterSpacing: '0.2em',
                            color: active ? 'var(--theme-accent)' : 'var(--ink-40)',
                          }}
                        >
                          {b.name}
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Number + title */}
                <div className="grid grid-cols-[6.5rem_1fr] gap-3">
                  <div>
                    <label htmlFor="hm-number" className="eyebrow block mb-2">
                      Number
                    </label>
                    <input
                      id="hm-number"
                      value={numberInput}
                      onChange={(e) => {
                        setNumberInput(e.target.value);
                        setMessage(null);
                      }}
                      placeholder={primary.heading?.number || (book === 'main' ? '788' : '15')}
                      className="input-field tabular-nums"
                      style={inputStyle}
                      inputMode={book === 'main' ? 'text' : 'numeric'}
                    />
                  </div>
                  <div className="min-w-0">
                    <label htmlFor="hm-title" className="eyebrow block mb-2">
                      Title{isBilingual ? ' · English' : ''}
                    </label>
                    <input
                      id="hm-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={autoTitle || 'From the first line'}
                      className="input-field"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {isBilingual && (
                  <div>
                    <label htmlFor="hm-title-yo" className="eyebrow block mb-2">
                      Title · Yorùbá
                    </label>
                    <input
                      id="hm-title-yo"
                      lang="yo"
                      value={secondaryTitle}
                      onChange={(e) => setSecondaryTitle(e.target.value)}
                      placeholder={autoSecondaryTitle || 'From the first Yorùbá line'}
                      className="input-field"
                      style={inputStyle}
                    />
                  </div>
                )}

                {/* Notices about the number */}
                {numberInvalid && (
                  <p className="text-sm" style={{ color: 'rgb(252, 165, 165)' }}>
                    {book === 'main' ? 'Use a number such as 788, or YS1.' : 'Use a number such as 15.'} Leave it blank for a hymn without one.
                  </p>
                )}
                {replacing && (
                  <div
                    className="text-sm px-4 py-3 rounded-xl flex flex-wrap items-center gap-x-3 gap-y-1"
                    style={{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.22)', color: 'var(--ink-80)' }}
                  >
                    <span>
                      {labelFor(replacing)} is already “{replacing.title}”. Saving replaces it on this computer.
                    </span>
                    <button
                      type="button"
                      onClick={() => loadForEditing(replacing)}
                      className="underline underline-offset-4 decoration-1"
                      style={{ color: 'var(--theme-accent)' }}
                    >
                      Load it to edit
                    </button>
                  </div>
                )}
                {editingId !== null && !replacing && (
                  <p className="text-sm" style={{ color: 'var(--ink-60)' }}>
                    Editing {labelFor({ number: editingId, displayNumber: existing?.displayNumber, unnumbered: editingUnnumbered, book }) || effectiveTitle}.
                    {getBuiltInHymn(editingId) && ' Your changes are kept on this computer; removing them later brings back the original.'}
                  </p>
                )}

                {/* Text */}
                <div className={isBilingual ? 'grid sm:grid-cols-2 gap-3' : ''}>
                  <div>
                    <label htmlFor="hm-text" className="eyebrow block mb-2">
                      {isBilingual ? 'English' : 'Hymn text'}
                    </label>
                    <textarea
                      id="hm-text"
                      value={text}
                      onChange={(e) => handleTextChange(e.target.value)}
                      placeholder={'1. When all Thy mercies, O my God,\nMy rising soul surveys,\n…\n\nRefrain:\n…'}
                      className="input-field resize-y min-h-[15rem] lg:min-h-[20rem] font-sans"
                      style={textareaStyle}
                      spellCheck={false}
                    />
                  </div>
                  {isBilingual && (
                    <div>
                      <label htmlFor="hm-text-yo" className="eyebrow block mb-2">
                        Yorùbá
                      </label>
                      <textarea
                        id="hm-text-yo"
                        lang="yo"
                        value={secondaryText}
                        onChange={(e) => {
                          setSecondaryText(e.target.value);
                          setMessage(null);
                        }}
                        placeholder={'1. Wà ba mi gbe! alẹ fẹrẹ lẹ tan,\n…\n\nEgbe:\n…'}
                        className="input-field resize-y min-h-[15rem] lg:min-h-[20rem] font-sans"
                        style={textareaStyle}
                        spellCheck={false}
                      />
                    </div>
                  )}
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-40)' }}>
                  Paste it as it appears. Verse numbers (1. or i.), blank lines between verses, markings like
                  mf and cr, and the / and | marks are all handled. Label a chorus “Refrain:” or “Egbe:” — or
                  write it once after verse 1.
                </p>
              </div>

              {/* ── Preview ── */}
              <div className="lg:min-h-0 lg:overflow-y-auto px-5 sm:px-7 py-5 border-t lg:border-t-0" style={{ background: 'rgba(0, 0, 0, 0.2)', borderColor: 'var(--hairline)' }}>
                <p className="eyebrow">Preview</p>
                {primary.verses.length === 0 ? (
                  <p className="mt-6 font-serif text-lg leading-relaxed" style={{ color: 'var(--ink-40)' }}>
                    Paste a hymn and its verses appear here, split the way they will be projected.
                  </p>
                ) : (
                  <>
                    <h3 className="font-display mt-2 leading-snug" style={{ fontSize: '1rem', letterSpacing: '0.06em', color: 'var(--theme-accent)' }}>
                      {savingAs && <span className="tabular-nums">{savingAs} · </span>}
                      {effectiveTitle || 'Untitled'}
                    </h3>
                    {isBilingual && effectiveSecondaryTitle && (
                      <p lang="yo" className="font-display mt-0.5" style={{ fontSize: '0.85rem', letterSpacing: '0.05em', color: 'var(--ink-60)' }}>
                        {effectiveSecondaryTitle}
                      </p>
                    )}
                    <p className="text-xs mt-1.5" style={{ color: 'var(--ink-40)' }}>
                      {primary.verses.length} verse{primary.verses.length === 1 ? '' : 's'}
                      {primary.refrain ? ' · chorus after each verse' : ''}
                      {primary.author ? ` · ${primary.author}` : ''}
                    </p>

                    {[...primary.warnings, ...(secondary?.warnings.map((w) => `Yorùbá: ${w}`) ?? []), ...pairingWarnings].map((w) => (
                      <p key={w} className="text-sm mt-3 flex gap-2" style={{ color: 'rgb(251, 191, 36)' }}>
                        <span aria-hidden="true">!</span>
                        <span>{w}</span>
                      </p>
                    ))}
                    {[...primary.notes, ...(secondary?.notes.map((n) => `Yorùbá: ${n}`) ?? [])].map((n) => (
                      <p key={n} className="text-sm mt-2 italic" style={{ color: 'var(--ink-60)' }}>
                        {n}
                      </p>
                    ))}

                    <div className="mt-4">
                      {rows.map((row, i) => (
                        <div key={i} className="py-3.5 border-t" style={{ borderColor: 'var(--hairline)' }}>
                          <p
                            className="eyebrow mb-2"
                            style={row.stanza.kind === 'refrain' ? { color: 'var(--theme-accent)' } : undefined}
                          >
                            {row.label}
                          </p>
                          <div className={isBilingual && secondary ? 'grid grid-cols-2 gap-5' : ''}>
                            <p className="font-serif whitespace-pre-line" style={{ fontSize: '1.12rem', lineHeight: 1.45, color: 'var(--ink-100)' }}>
                              {row.stanza.lines.join('\n')}
                            </p>
                            {isBilingual && secondary && (
                              <p
                                lang="yo"
                                className="font-serif whitespace-pre-line"
                                style={{ fontSize: '1.12rem', lineHeight: 1.45, color: row.pair ? 'var(--ink-100)' : 'var(--ink-20)' }}
                              >
                                {row.pair ? row.pair.lines.join('\n') : 'No Yorùbá for this one'}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="flex flex-wrap items-center gap-3 px-5 sm:px-7 py-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <div className="flex-1 min-w-[12rem]">
                {messageLine || (
                  <p className="text-xs" style={{ color: 'var(--ink-40)' }}>
                    Saved in this browser on this computer.
                  </p>
                )}
              </div>
              {editingId !== null && (
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Cancel
                </button>
              )}
              <button type="button" onClick={handleSave} disabled={!canSave} className="btn-primary disabled:cursor-not-allowed">
                Save hymn
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-7 py-4">
              {sortedSaved.length === 0 ? (
                <p className="py-12 text-center font-serif text-lg" style={{ color: 'var(--ink-40)' }}>
                  Hymns you add or change here appear in this list.
                </p>
              ) : (
                sortedSaved.map((hymn) => {
                  const label = labelFor(hymn);
                  const replacesOriginal = !!getBuiltInHymn(hymn.number);
                  return (
                    <div key={hymn.number} className="flex items-center gap-3 py-3 border-t first:border-t-0" style={{ borderColor: 'var(--hairline)' }}>
                      <span
                        className="text-[11px] font-medium px-2 py-1 rounded-md shrink-0 tabular-nums min-w-[4.5rem] text-center whitespace-nowrap"
                        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--hairline)', color: 'var(--theme-accent)' }}
                      >
                        {label || 'No number'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm" style={{ color: 'var(--ink-100)' }}>
                          {hymn.title}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--ink-40)' }}>
                          {hymn.verses.length} verse{hymn.verses.length === 1 ? '' : 's'}
                          {hymn.refrain ? ' · chorus' : ''}
                          {hymn.secondaryVerses?.some(Boolean) ? ' · with Yorùbá' : ''}
                          {replacesOriginal ? ' · replaces the version that came with the app' : ''}
                        </p>
                      </div>
                      <button type="button" onClick={() => loadForEditing(hymn)} className="btn-secondary !py-1.5 !px-3 text-xs shrink-0">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(hymn)}
                        className="btn-ghost shrink-0"
                        aria-label={replacesOriginal ? `Remove changes to ${hymn.title}` : `Delete ${hymn.title}`}
                        title={replacesOriginal ? 'Remove changes' : 'Delete'}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 px-5 sm:px-7 py-4 border-t" style={{ borderColor: 'var(--hairline)' }}>
              <div className="flex-1 min-w-[12rem]">
                {messageLine || (
                  <p className="text-xs" style={{ color: 'var(--ink-40)' }}>
                    Kept in this browser only. Download a backup to move them to another computer.
                  </p>
                )}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary">
                Restore backup
              </button>
              <button type="button" onClick={handleBackup} disabled={saved.length === 0} className="btn-secondary disabled:opacity-40">
                Download backup
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleRestore(file);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
