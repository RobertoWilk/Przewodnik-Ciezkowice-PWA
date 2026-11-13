import { useMemo, useState } from 'react';
import type { User } from '../types';

import { localization } from '../localization';
import { useLangStore } from '../stores/LangStore';
import { LanguageCode } from '../types/Language';

interface TestCenterPageProps {
  token?: string;
  user?: User | null;
  onOpenAuth: () => void;
}

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  id: string;
  group: string;
  name: string;
  status: TestStatus;
  details: string;
  durationMs?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export function TestCenterPage({ token, user, onOpenAuth }: TestCenterPageProps) {
  const lang: LanguageCode = useLangStore((store) => store.language);
  const [results, setResults] = useState<TestResult[]>(initialTests(lang));
  const [running, setRunning] = useState(false);

  const isAllowed = user?.role === 'admin' || user?.role === 'moderator';
  const summary = useMemo(() => {
    return {
      passed: results.filter((result) => result.status === 'passed').length,
      failed: results.filter((result) => result.status === 'failed').length,
      pending: results.filter((result) => result.status === 'pending').length,
      running: results.filter((result) => result.status === 'running').length
    };
  }, [results]);

  if (!isAllowed) {
    return (
      <main className="page article-page">
        <span className="eyebrow">{localization.test_eb[lang]}</span>
        <h1>{localization.test_guest_header[lang]}</h1>
        <p>{localization.test_guest_desc[lang]}</p>
        <button className="primary" onClick={onOpenAuth}>{localization.test_log[lang]}</button>
      </main>
    );
  }

  async function runTests() {
    setRunning(true);
    const definitions = testDefinitions(lang, token);
    setResults(definitions.map((test) => ({ id: test.id, group: test.group, name: test.name, status: 'pending', details: localization.test_pending[lang] })));

    for (const definition of definitions) {
      setResults((current) => updateResult(current, definition.id, { status: 'running', details: localization.test_running[lang] }));
      const start = performance.now();
      try {
        const details = await definition.run();
        setResults((current) => updateResult(current, definition.id, { status: 'passed', details, durationMs: Math.round(performance.now() - start) }));
      } catch (error) {
        setResults((current) => updateResult(current, definition.id, { status: 'failed', details: error instanceof Error ? error.message : localization.test_failed[lang], durationMs: Math.round(performance.now() - start) }));
      }
    }

    setRunning(false);
  }

  function exportResults() {
    const payload = {
      generatedAt: new Date().toISOString(),
      user: user?.email,
      summary,
      results
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wyniki-testow-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page test-center-page">
      <section className="section-heading">
        <div>
          <span className="eyebrow">{localization.test_eb[lang]}</span>
          <h1>{localization.test_header[lang]}</h1>
          <p>{localization.test_desc[lang]}</p>
        </div>
        <div className="card-actions">
          <button className="primary" onClick={runTests} disabled={running}>{running ? localization.test_run[lang] : localization.test_launch[lang]}</button>
          <button className="secondary" onClick={exportResults} disabled={!results.some((result) => result.status !== 'pending')}>{localization.test_export[lang]}</button>
        </div>
      </section>

      <section className="test-summary-grid">
        <article><strong>{summary.passed}</strong><span>{localization.test_stat_pass[lang]}</span></article>
        <article><strong>{summary.failed}</strong><span>{localization.test_stat_fail[lang]}</span></article>
        <article><strong>{summary.running}</strong><span>{localization.test_stat_run[lang]}</span></article>
        <article><strong>{results.length}</strong><span>{localization.test_stat_res[lang]}</span></article>
      </section>

      <section className="test-result-list">
        {results.map((result) => (
          <article className={`test-result ${result.status}`} key={result.id}>
            <div>
              <span className="test-group">{result.group}</span>
              <h2>{result.name}</h2>
              <p>{result.details}</p>
            </div>
            <div className="test-status-pill">
              {statusLabel(result.status, lang)}
              {result.durationMs !== undefined && <small>{result.durationMs} ms</small>}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

interface TestDefinition {
  id: string;
  group: string;
  name: string;
  run: () => Promise<string>;
}

function testDefinitions(lang: LanguageCode, token?: string): TestDefinition[] { 

  return [
    endpointTest('api-health', 'API', localization.test_name_1[lang], '/health', lang),
    endpointTest('api-places', 'API', localization.test_name_2[lang], '/places', lang, (data) => Array.isArray(data) && data.length > 0),
    endpointTest('api-routes', 'API', localization.test_name_3[lang], '/routes', lang, (data) => Array.isArray(data)),
    endpointTest('api-itineraries', 'API', localization.test_name_4[lang], '/itineraries', lang, (data) => Array.isArray(data)),
    endpointTest('api-settings', 'API', localization.test_name_5[lang], '/settings', lang, (data) => Boolean(data.appTitle)),
    {
      id: 'security-headers',
      group: localization.test_group_safe[lang],
      name: localization.test_name_6[lang],
      run: async () => {
        const response = await fetch(`${API_BASE}/health`);
        expectHeader(response, 'x-content-type-options', 'nosniff', lang);
        expectHeader(response, 'x-frame-options', 'DENY', lang);
        expectHeader(response, 'referrer-policy', 'no-referrer', lang);
        return localization.test_succ_1[lang];
      }
    },
    {
      id: 'security-admin-without-token',
      group: localization.test_group_safe[lang],
      name: localization.test_name_7[lang],
      run: async () => {
        const response = await fetch(`${API_BASE}/admin/users`);
        if (response.status !== 401) throw new Error(`${localization.test_fail_1[lang]} ${response.status}.`);
        return localization.test_succ_2[lang];
      }
    },
    {
      id: 'security-admin-current-token',
      group: localization.test_group_safe[lang],
      name: localization.test_name_8[lang],
      run: async () => {
        if (!token) throw new Error(localization.test_fail_2[lang]);
        const response = await fetch(`${API_BASE}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(`${localization.test_fail_3[lang]} ${response.status}.`);
        return localization.test_succ_3[lang];
      }
    },
    {
      id: 'security-xss-like-query',
      group: localization.test_group_safe[lang],
      name: localization.test_name_9[lang],
      run: async () => {
        const response = await fetch(`${API_BASE}/places?q=${encodeURIComponent('<script>alert(1)</script>')}`);
        if (!response.ok) throw new Error(`${localization.test_fail_4[lang]} ${response.status}.`);
        await response.json();
        return localization.test_succ_4[lang];
      }
    },
    {
      id: 'pwa-manifest',
      group: 'PWA',
      name: localization.test_name_10[lang],
      run: async () => {
        const response = await fetch('/manifest.webmanifest');
        if (!response.ok) throw new Error(`${localization.test_fail_5[lang]} ${response.status}.`);
        const data = await response.json();
        if (!data.name || !data.display) throw new Error(localization.test_fail_6[lang]);
        return `${localization.test_succ_5[lang]}: ${data.name}, display=${data.display}.`;
      }
    },
    {
      id: 'local-storage',
      group: localization.test_group_brsr[lang],
      name: localization.test_name_11[lang],
      run: async () => {
        const key = 'ciezkowice.test';
        localStorage.setItem(key, 'ok');
        const value = localStorage.getItem(key);
        localStorage.removeItem(key);
        if (value !== 'ok') throw new Error(localization.test_fail_7[lang]);
        return localization.test_succ_6[lang];
      }
    },
    {
      id: 'geolocation-available',
      group: localization.test_group_brsr[lang],
      name: localization.test_name_12[lang],
      run: async () => {
        if (!('geolocation' in navigator)) throw new Error(localization.test_fail_8[lang]);
        return 'navigator.geolocation' + `${localization.test_succ_7[lang]}`;
      }
    }
  ];
}

function endpointTest(id: string, group: string, name: string, path: string, lang: LanguageCode, validate?: (data: any) => boolean): TestDefinition {

  return {
    id,
    group,
    name,
    run: async () => {
      const response = await fetch(`${API_BASE}${path}`);
      if (!response.ok) throw new Error(`Endpoint ${path} ${localization.test_return_sm[lang]} ${response.status}.`);
      const data = await response.json();
      if (validate && !validate(data)) throw new Error(`Endpoint ${path} ${localization.test_return_lg[lang]}`);
      const count = Array.isArray(data) ? data.length : Object.keys(data).length;
      return `${localization.test_success[lang]}: ${count}.`;
    }
  };
}

function expectHeader(response: Response, header: string, expected: string, lang: LanguageCode) {

  const value = response.headers.get(header);
  if (value !== expected) throw new Error(`${localization.test_head_1[lang]} ${header}:
                                             ${localization.test_head_2[lang]} ${expected},
                                              ${localization.test_head_3[lang]} ${value}.`);
}

function initialTests(lang: LanguageCode): TestResult[] {
  
  return testDefinitions(lang).map((test) => ({ id: test.id, group: test.group, name: test.name, status: 'pending', details: localization.test_init[lang] }));
}

function updateResult(results: TestResult[], id: string, patch: Partial<TestResult>) {
  return results.map((result) => (result.id === id ? { ...result, ...patch } : result));
}

function statusLabel(status: TestStatus, lang: LanguageCode) {

  const labels: Record<TestStatus, string> = {
    pending: localization.test_lbl_pend[lang],
    running: localization.test_lbl_run[lang],
    passed: localization.test_lbl_pass[lang],
    failed: localization.test_lbl_fail[lang]
  };
  return labels[status];
}
