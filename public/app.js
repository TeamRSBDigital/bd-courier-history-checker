(() => {
  'use strict';
  const names = { steadfast: 'Steadfast', pathao: 'Pathao', redx: 'REDX', carrybee: 'CarryBee' };
  const form = document.getElementById('checker-form');
  const input = document.getElementById('phone');
  const error = document.getElementById('phone-error');
  const button = document.getElementById('check-button');
  const statusSection = document.getElementById('status-section');
  const progressGrid = document.getElementById('progress-grid');
  const overallStatus = document.getElementById('overall-status');
  const resultsSection = document.getElementById('results-section');
  const newCheck = document.getElementById('new-check');
  const resultMessage = document.getElementById('result-message');

  function normalize(value) {
    let phone = String(value || '').trim().replace(/[\s()-]/g, '');
    if (phone.startsWith('+880')) phone = `0${phone.slice(4)}`;
    else if (phone.startsWith('880')) phone = `0${phone.slice(3)}`;
    else if (/^1[3-9]\d{8}$/.test(phone)) phone = `0${phone}`;
    return /^01[3-9]\d{8}$/.test(phone) ? phone : null;
  }

  function renderProgress(state, providers) {
    progressGrid.textContent = '';
    providers.forEach((provider) => {
      const item = document.createElement('article');
      item.className = 'progress-item';
      const top = document.createElement('div');
      top.className = 'progress-top';
      const title = document.createElement('strong');
      title.textContent = names[provider.courier] || provider.courier;
      const dot = document.createElement('span');
      dot.className = `dot ${state === 'checking' ? 'checking' : (provider.available ? 'ok' : 'warn')}`;
      dot.setAttribute('aria-hidden', 'true');
      top.append(title, dot);
      const detail = document.createElement('p');
      detail.textContent = state === 'checking' ? `Checking ${names[provider.courier] || provider.courier}...` : statusLabel(provider);
      item.append(top, detail);
      progressGrid.append(item);
    });
  }

  function statusLabel(provider) {
    if (provider.status === 'ok') return 'Delivery history received';
    if (provider.status === 'no_data') return 'No history found';
    if (provider.status === 'timeout') return 'Timed out';
    if (provider.status === 'rate_limited') return 'Temporarily rate limited';
    return 'Temporarily unavailable';
  }

  function valueOrDash(value) { return value === null || value === undefined ? '—' : String(value); }
  function percent(value) { return value === null || value === undefined ? '—' : `${Number(value).toFixed(Number(value) % 1 ? 2 : 0)}%`; }

  function renderResults(data) {
    document.getElementById('masked-number').textContent = `Checked: ${data.phone_masked}`;
    document.getElementById('metric-success').textContent = percent(data.summary.success_rate);
    document.getElementById('metric-total').textContent = valueOrDash(data.summary.total_orders);
    document.getElementById('metric-delivered').textContent = valueOrDash(data.summary.delivered);
    document.getElementById('metric-returned').textContent = valueOrDash(data.summary.returned_cancelled);
    const risk = document.getElementById('metric-risk');
    risk.textContent = String(data.summary.risk).replaceAll('_', ' ');
    risk.dataset.risk = data.summary.risk;
    document.getElementById('metric-reporting').textContent = `${data.summary.couriers_reporting} courier${data.summary.couriers_reporting === 1 ? '' : 's'} reporting compatible data`;
    document.getElementById('result-disclaimer').textContent = data.disclaimer;

    const unavailable = data.couriers.filter((provider) => !provider.available).length;
    resultMessage.classList.toggle('hidden', unavailable === 0);
    if (unavailable > 0) resultMessage.textContent = `${unavailable} courier${unavailable === 1 ? '' : 's'} could not provide data. Available results are still shown.`;

    const grid = document.getElementById('courier-results');
    grid.textContent = '';
    data.couriers.forEach((provider) => {
      const card = document.createElement('article');
      card.className = 'courier-card';
      const title = document.createElement('h4');
      title.textContent = names[provider.courier] || provider.courier;
      const status = document.createElement('p');
      status.className = 'provider-status';
      status.textContent = statusLabel(provider);
      const stats = document.createElement('div');
      stats.className = 'courier-stats';
      [['Total', provider.available ? provider.total : null], ['Delivered', provider.available ? provider.delivered : null], ['Returned / cancelled', provider.available ? provider.returned + provider.cancelled : null], ['Success', provider.available ? percent(provider.success_rate) : null]].forEach(([label, value]) => {
        const cell = document.createElement('div');
        const l = document.createElement('span'); l.textContent = label;
        const v = document.createElement('strong'); v.textContent = value === null ? '—' : String(value);
        cell.append(l, v); stats.append(cell);
      });
      card.append(title, status, stats); grid.append(card);
    });
  }

  async function submit(event) {
    event.preventDefault();
    error.textContent = '';
    const phone = normalize(input.value);
    if (!phone) { error.textContent = 'Enter a valid Bangladeshi mobile number.'; input.focus(); return; }
    button.disabled = true;
    statusSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    overallStatus.textContent = 'In progress';
    renderProgress('checking', ['steadfast', 'pathao', 'redx', 'carrybee'].map((courier) => ({ courier, available: false })));
    statusSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
      const response = await fetch('/api/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
        credentials: 'same-origin'
      });
      let payload = null;
      try { payload = await response.json(); } catch { payload = null; }
      if (!response.ok) {
        const message = payload && payload.error && payload.error.message ? payload.error.message : 'The check could not be completed. Please try again.';
        throw new Error(message);
      }
      renderProgress('done', payload.couriers);
      overallStatus.textContent = payload.couriers.some((p) => !p.available) ? 'Partial result' : 'Complete';
      renderResults(payload);
      resultsSection.classList.remove('hidden');
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      overallStatus.textContent = 'Unable to complete';
      renderProgress('done', ['steadfast', 'pathao', 'redx', 'carrybee'].map((courier) => ({ courier, available: false, status: 'unavailable' })));
      error.textContent = err instanceof Error ? err.message : 'The check could not be completed.';
      document.querySelector('.checker-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      button.disabled = false;
    }
  }

  form.addEventListener('submit', submit);
  newCheck.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    statusSection.classList.add('hidden');
    input.value = '';
    error.textContent = '';
    input.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
