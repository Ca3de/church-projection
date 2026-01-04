import { useState, useCallback } from 'react';
import { parseHymnText, addCustomHymn, getCustomHymnsList, deleteCustomHymn } from '../services/hymnService';
import type { Hymn } from '../types/hymn';

interface HymnManagerProps {
  onClose: () => void;
}

export function HymnManager({ onClose }: HymnManagerProps) {
  const [hymnText, setHymnText] = useState('');
  const [hymnNumber, setHymnNumber] = useState('');
  const [hymnTitle, setHymnTitle] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customHymns, setCustomHymns] = useState<Hymn[]>(getCustomHymnsList);
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');

  const refreshCustomHymns = useCallback(() => {
    setCustomHymns(getCustomHymnsList());
  }, []);

  const handleAddHymn = useCallback(() => {
    if (!hymnText.trim()) {
      setMessage({ type: 'error', text: 'Please paste the hymn text' });
      return;
    }

    // Try to parse the hymn
    let hymn = parseHymnText(hymnText);

    if (!hymn) {
      setMessage({ type: 'error', text: 'Could not parse hymn. Make sure verses start with "1.", "2.", etc.' });
      return;
    }

    // Override number and title if provided
    if (hymnNumber) {
      const num = parseInt(hymnNumber, 10);
      if (!isNaN(num)) {
        hymn.number = num;
      }
    }

    if (hymnTitle) {
      hymn.title = hymnTitle;
    }

    if (!hymn.title) {
      setMessage({ type: 'error', text: 'Please provide a hymn title' });
      return;
    }

    addCustomHymn(hymn);
    setMessage({ type: 'success', text: `Hymn "${hymn.title}" (#${hymn.number}) added successfully!` });
    setHymnText('');
    setHymnNumber('');
    setHymnTitle('');
    refreshCustomHymns();
  }, [hymnText, hymnNumber, hymnTitle, refreshCustomHymns]);

  const handleDeleteHymn = useCallback((hymnNumber: number, title: string) => {
    if (confirm(`Delete hymn "${title}" (#${hymnNumber})?`)) {
      deleteCustomHymn(hymnNumber);
      setMessage({ type: 'success', text: `Hymn deleted` });
      refreshCustomHymns();
    }
  }, [refreshCustomHymns]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-stone-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Hymn Manager</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'add' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/60 hover:text-white'}`}
          >
            Add Hymn
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'manage' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-white/60 hover:text-white'}`}
          >
            My Hymns ({customHymns.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'add' ? (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="text-white/60 text-sm space-y-1">
                <p>Paste hymn text below. Format:</p>
                <pre className="bg-black/30 p-2 rounded text-xs overflow-x-auto">
{`1. First verse line one,
First verse line two.
Refrain:
Refrain line one,
Refrain line two.
2. Second verse line one,
Second verse line two.`}
                </pre>
              </div>

              {/* Number and Title inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Hymn Number</label>
                  <input
                    type="text"
                    value={hymnNumber}
                    onChange={(e) => setHymnNumber(e.target.value)}
                    placeholder="e.g., 523"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-white placeholder-white/30"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Title (optional if in text)</label>
                  <input
                    type="text"
                    value={hymnTitle}
                    onChange={(e) => setHymnTitle(e.target.value)}
                    placeholder="e.g., Higher Ground"
                    className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-white placeholder-white/30"
                  />
                </div>
              </div>

              {/* Hymn text area */}
              <div>
                <label className="block text-white/60 text-sm mb-1">Hymn Text</label>
                <textarea
                  value={hymnText}
                  onChange={(e) => setHymnText(e.target.value)}
                  placeholder="Paste the full hymn text here..."
                  className="w-full h-64 px-3 py-2 bg-black/30 border border-white/10 rounded text-white placeholder-white/30 font-mono text-sm resize-none"
                />
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {message.text}
                </div>
              )}

              {/* Add button */}
              <button
                onClick={handleAddHymn}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded"
              >
                Add Hymn
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {customHymns.length === 0 ? (
                <p className="text-white/40 text-center py-8">No custom hymns added yet</p>
              ) : (
                customHymns.map((hymn) => (
                  <div
                    key={hymn.number}
                    className="flex items-center justify-between p-3 bg-black/20 rounded"
                  >
                    <div>
                      <span className="text-amber-400 mr-2">#{hymn.number}</span>
                      <span className="text-white">{hymn.title}</span>
                      <span className="text-white/40 ml-2 text-sm">
                        ({hymn.verses.length} verses{hymn.refrain ? ' + refrain' : ''})
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteHymn(hymn.number, hymn.title)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}

              {message && (
                <div className={`p-3 rounded ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {message.text}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
