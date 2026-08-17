(() => {
  'use strict';
  const loginPanel = document.getElementById('login-panel');
  const dashboardPanel = document.getElementById('dashboard-panel');
  const form = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');

  function item(title, value, detail) {
    const box = document.createElement('article'); box.className = 'admin-item';
    const strong = document.createElement('strong'); strong.textContent = title;
    const valueP = document.createElement('p'); valueP.textContent = value;
    box.append(strong, valueP);
    if (detail) { const detailP = document.createElement('p'); detailP.textContent = detail; box.append(detailP); }
    return box;
  }

  async function loadDashboard() {
    const response = await fetch('/api/admin/dashboard', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return false;
    const data = await response.json();
    loginPanel.classList.add('hidden'); dashboardPanel.classList.remove('hidden');
    document.getElementById('generated-at').textContent = `Generated ${new Date(data.generated_at).toLocaleString()}`;
    const app = document.getElementById('app-health'); app.textContent = '';
    Object.entries(data.application || {}).forEach(([key, value]) => app.append(item(key.replaceAll('_', ' ').toUpperCase(), String(value).replaceAll('_', ' '), 'Configuration state only; no secret values')));
    const providers = document.getElementById('provider-status'); providers.textContent = '';
    data.providers.forEach((provider) => providers.append(item(provider.courier.toUpperCase(), provider.state.replaceAll('_', ' '), provider.detail)));
    const metrics = document.getElementById('metrics'); metrics.textContent = '';
    const checks = data.metrics && data.metrics.checks ? data.metrics.checks : {};
    ['total', 'success', 'partial', 'no_data', 'failed'].forEach((key) => metrics.append(item(key.replaceAll('_', ' ').toUpperCase(), String(checks[key] || 0), key === 'total' ? `Storage: ${data.metrics.storage}` : 'Aggregate count only')));
    const rate = document.getElementById('rate-limit'); rate.textContent = '';
    const rateData = data.metrics && data.metrics.rate_limit ? data.metrics.rate_limit : {};
    ['check:attempts', 'check:blocked', 'admin-login:attempts', 'admin-login:blocked'].forEach((key) => rate.append(item(key.replace(':', ' ').replaceAll('-', ' ').toUpperCase(), String(rateData[key] || 0), 'Aggregate count only')));
    const latency = document.getElementById('latency'); latency.textContent = '';
    const latencyData = data.metrics && data.metrics.latency ? data.metrics.latency : {};
    ['steadfast', 'pathao', 'redx', 'carrybee'].forEach((courier) => { const row = latencyData[courier] || {}; latency.append(item(courier.toUpperCase(), `${row.average_ms || 0} ms`, `${row.calls || 0} measured checks`)); });
    const errors = document.getElementById('recent-errors'); errors.textContent = '';
    const errorData = data.metrics && data.metrics.errors ? data.metrics.errors : {};
    ['steadfast', 'pathao', 'redx', 'carrybee'].forEach((courier) => { const row = errorData[courier]; errors.append(item(courier.toUpperCase(), row ? String(row.status || 'unavailable').replaceAll('_', ' ') : 'none recorded', row && row.at ? new Date(row.at).toLocaleString() : 'Sanitized provider status only')); });
    return true;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); loginError.textContent = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ username, password }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload && payload.error ? payload.error.message : 'Sign in failed.');
      document.getElementById('password').value = '';
      await loadDashboard();
    } catch (error) { loginError.textContent = error instanceof Error ? error.message : 'Sign in failed.'; }
  });

  document.getElementById('logout').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}', credentials: 'same-origin' });
    dashboardPanel.classList.add('hidden'); loginPanel.classList.remove('hidden');
  });

  loadDashboard().catch(() => false);
})();
