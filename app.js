const months = ['Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep'];
const revenueSeries = [62, 72, 68, 81, 75, 91, 86, 102, 96, 111, 106, 128];
const forecastBoost = { all: 1, north: 1.18, south: 1.08, west: 1.12 };
let revenueChart, channelChart, miniChart;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}

function renderLegend() {
  const colors = ['#6d5dfc', '#48b6e8', '#f5af47', '#67c69d'];
  const labels = ['Direct', 'Organic search', 'Referral', 'Social media'];
  const values = [42, 28, 18, 12];
  $('#channelLegend').innerHTML = labels.map((label, i) => `
    <div class="legend-item">
      <i style="background:${colors[i]}"></i>
      <span>${label}</span>
      <b>${values[i]}%</b>
    </div>
  `).join('');
}

function initCharts() {
  const gridColor = '#eef0f5';

  revenueChart = new Chart($('#revenueChart'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Revenue',
        data: revenueSeries,
        borderColor: '#6d5dfc',
        backgroundColor: 'rgba(109,93,252,0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        pointBorderColor: '#6d5dfc'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#202a3a', padding: 10, displayColors: false, callbacks: { label: (ctx) => '$' + ctx.raw + 'k' } } },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: '#a4abba', font: { size: 10 } } },
        y: { grid: { color: gridColor }, border: { display: false }, ticks: { color: '#a4abba', font: { size: 10 }, callback: (v) => '$' + v + 'k' }, beginAtZero: true }
      }
    }
  });

  channelChart = new Chart($('#channelChart'), {
    type: 'doughnut',
    data: {
      labels: ['Direct', 'Organic search', 'Referral', 'Social media'],
      datasets: [{
        data: [42, 28, 18, 12],
        backgroundColor: ['#6d5dfc', '#48b6e8', '#f5af47', '#67c69d'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '76%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + ctx.raw + '%' } } }
    }
  });

  miniChart = new Chart($('#miniChart'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Trend',
        data: [64, 71, 69, 82, 88, 94],
        borderColor: '#6d5dfc',
        backgroundColor: 'rgba(109,93,252,0.12)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });

  renderLegend();
}

function showView(view) {
  $$('.page-view').forEach((page) => page.classList.add('hidden'));
  $('#' + view + 'View').classList.remove('hidden');
  $$('.nav-item[data-view]').forEach((item) => item.classList.toggle('active', item.dataset.view === view));
  $('#pageTitle').textContent = view.charAt(0).toUpperCase() + view.slice(1);
  if (view === 'datasets') renderDataset();
}

function setupNav() {
  $$('.nav-item[data-view]').forEach((item) => item.addEventListener('click', () => showView(item.dataset.view)));
}

function openModal() {
  $('#modal').classList.remove('hidden');
  $('#reportName').focus();
}

function closeModal() {
  $('#modal').classList.add('hidden');
}

function setupModal() {
  ['newReport', 'newReport2', 'createReport'].forEach((id) => {
    const el = $('#' + id);
    if (el) el.addEventListener('click', openModal);
  });

  $('#modalClose').onclick = closeModal;
  $('#cancelModal').onclick = closeModal;
  $('#createModal').onclick = () => {
    const name = $('#reportName').value.trim() || 'Untitled report';
    localStorage.setItem('lastReport', name);
    closeModal();
    toast(`${name} created successfully`);
    $('#reportName').value = '';
  };
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = splitCSV(lines.shift());
  return lines.map((line) => {
    const vals = splitCSV(line);
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = vals[index]?.trim() || '';
      return obj;
    }, {});
  });
}

function splitCSV(line) {
  const out = [];
  let value = '';
  let quote = false;

  for (const char of line) {
    if (char === '"') {
      quote = !quote;
    } else if (char === ',' && !quote) {
      out.push(value.replace(/^"|"$/g, ''));
      value = '';
    } else {
      value += char;
    }
  }

  out.push(value);
  return out;
}

function setupUpload() {
  ['uploadButton', 'datasetUpload', 'emptyUpload'].forEach((id) => {
    const el = $('#' + id);
    if (el) el.addEventListener('click', () => $('#fileInput').click());
  });

  $('#fileInput').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        let rows;

        if (file.name.endsWith('.json')) {
          rows = JSON.parse(text);
        } else {
          rows = parseCSV(text);
        }

        if (!Array.isArray(rows) || !rows.length) throw new Error('No rows found');

        localStorage.setItem('dataset', JSON.stringify({ name: file.name, rows }));
        renderDataset();
        showView('datasets');
        toast(`${file.name} imported successfully`);
      } catch (error) {
        toast('Could not read this file. Please use CSV or JSON.');
      }
    };

    reader.readAsText(file);
  });
}

function renderDataset() {
  const saved = JSON.parse(localStorage.getItem('dataset') || 'null');

  if (!saved) {
    $('#datasetEmpty').classList.remove('hidden');
    $('#datasetTable').classList.add('hidden');
    return;
  }

  const rows = saved.rows;
  const columns = Object.keys(rows[0]);

  $('#datasetEmpty').classList.add('hidden');
  $('#datasetTable').classList.remove('hidden');
  $('#datasetTable').innerHTML = `
    <div class="panel-header">
      <div>
        <h2>${saved.name}</h2>
        <p class="muted">${rows.length} rows · ${columns.length} columns</p>
      </div>
      <button class="secondary-button" id="removeDataset">Remove</button>
    </div>
    <div style="overflow:auto;margin-top:20px">
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr>
            ${columns.map((column) => `<th style="text-align:left;padding:11px;background:#f7f8fc;border-bottom:1px solid #e8ebf2">${column}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.slice(0, 50).map((row) => `
            <tr>
              ${columns.map((column) => `<td style="padding:11px;border-bottom:1px solid #f0f1f5">${row[column] ?? ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  $('#removeDataset').onclick = () => {
    localStorage.removeItem('dataset');
    renderDataset();
    toast('Dataset removed');
  };
}

function setupThemeToggle() {
  const toggle = $('#themeToggle');
  toggle.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-theme');
    toggle.textContent = isDark ? '☀' : '☾';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    toggle.textContent = '☀';
  }
}

function updateDashboardMetrics(region = 'all', segment = 'all') {
  const scales = {
    all: { revenue: 1, orders: 1, customers: 1, forecast: 1 },
    north: { revenue: 1.18, orders: 1.12, customers: 1.09, forecast: 1.22 },
    south: { revenue: 1.06, orders: 1.04, customers: 1.1, forecast: 1.11 },
    west: { revenue: 1.14, orders: 1.08, customers: 1.12, forecast: 1.16 }
  };

  const segmentFactor = {
    all: 1,
    enterprise: 1.15,
    'mid-market': 1.08,
    startup: 0.92
  };

  const regionScale = scales[region] || scales.all;
  const segmentScale = segmentFactor[segment] || segmentFactor.all;
  const factor = regionScale.revenue * segmentScale;

  $('#totalRevenue').textContent = '$' + Math.round(128430 * factor).toLocaleString();
  $('#totalOrders').textContent = Math.round(2847 * regionScale.orders * segmentScale).toLocaleString();
  $('#totalCustomers').textContent = Math.round(1429 * regionScale.customers * segmentScale).toLocaleString();
  $('#forecastValue').textContent = '+' + (18.2 * regionScale.forecast * segmentScale).toFixed(1) + '%';
}

function setupFilters() {
  document.querySelectorAll('.chip[data-region]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-region]').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      const region = chip.dataset.region;
      const segment = document.querySelector('.chip[data-segment].active')?.dataset.segment || 'all';
      updateDashboardMetrics(region, segment);
    });
  });

  document.querySelectorAll('.chip[data-segment]').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip[data-segment]').forEach((item) => item.classList.remove('active'));
      chip.classList.add('active');
      const segment = chip.dataset.segment;
      const region = document.querySelector('.chip[data-region].active')?.dataset.region || 'all';
      updateDashboardMetrics(region, segment);
    });
  });
}

function setupMisc() {
  $('#addFavorite').onclick = () => {
    $('#favorites').innerHTML = '<div class="favorite-item">★ Executive Overview</div>' + '<div class="favorite-item">★ AI Trend Monitor</div>';
    toast('Added to favorites');
  };

  $('#editDashboard').onclick = () => toast('Dashboard editor is ready for customization');
  $('#generateInsights').onclick = () => toast('AI insights refreshed');

  $$('.open-report').forEach((button) => {
    button.onclick = () => {
      showView('overview');
      toast('Report opened');
    };
  });

  $('#periodSelect').onchange = (event) => {
    toast(`Showing ${event.target.value.toLowerCase()}`);
  };
}

function initializeApp() {
  setupNav();
  setupModal();
  setupUpload();
  setupThemeToggle();
  setupFilters();
  setupMisc();
  initCharts();
  updateDashboardMetrics();
  renderDataset();
  showView('overview');
}

document.addEventListener('DOMContentLoaded', initializeApp);

