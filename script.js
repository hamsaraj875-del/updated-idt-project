// ================== LOCAL STORAGE KEYS ==================
const KEY_APPLIANCES = 'ecs_appliances_v1';
const KEY_LIMIT = 'ecs_maxlimit_v1';
const KEY_HISTORY = 'ecs_history_v1';
const KEY_NOTIFS = 'ecs_notifications_v1';

// ================== ECS VARIABLES ==================
let appliances = [];
let maxLimit = 0;
let history = JSON.parse(localStorage.getItem(KEY_HISTORY) || '[]');
let notifications = JSON.parse(localStorage.getItem(KEY_NOTIFS) || '[]');

let selectedAppliances = [];
let secondsPassed = 0;
let timerInterval = null;
let limitCrossedThisSession = false;
let chart = null;
let pieChart = null;

// ================== ELEMENTS ==================
const setupSection = document.getElementById('setupSection');
const monitorSection = document.getElementById('monitorSection');
const applianceName = document.getElementById('applianceName');
const appliancePower = document.getElementById('appliancePower');
const applianceList = document.getElementById('applianceList');
const maxLimitInput = document.getElementById('maxLimit');
const monitorAppliances = document.getElementById('monitorAppliances');
const timer = document.getElementById('timer');
const resultsButtons = document.getElementById('resultsButtons');
const graphHeader = document.getElementById('graphHeader');
const energyChart = document.getElementById('energyChart');
const pieWrapper = document.getElementById('pieWrapper');
const appliancePieChart = document.getElementById('appliancePieChart');
const suggestionsBox = document.getElementById('suggestionsBox');
const notificationsBox = document.getElementById('notificationsBox');

// ================== HELPER FUNCTIONS ==================
function formatHMS(sec) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function saveStorage(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ================== INITIAL LOAD ==================
window.addEventListener('load', () => {
  appliances = JSON.parse(localStorage.getItem(KEY_APPLIANCES) || '[]');
  maxLimit = Number(localStorage.getItem(KEY_LIMIT) || 0);
  history = JSON.parse(localStorage.getItem(KEY_HISTORY) || '[]');
  notifications = JSON.parse(localStorage.getItem(KEY_NOTIFS) || '[]');

  if (appliances.length === 0) openSetup();
  else {
    monitorSection.style.display = 'block';
    populateMonitorAppliances();
  }
});

// ================== SETUP FUNCTIONS ==================
function openSetup() {
  setupSection.style.display = 'block';
}

function closeSetup() {
  setupSection.style.display = 'none';
}

function addAppliance() {
  const name = applianceName.value.trim();
  const power = Number(appliancePower.value);
  if (!name || power <= 0) return alert("Invalid input");
  appliances.push({ name, power });
  populateSetupList();
  applianceName.value = '';
  appliancePower.value = '';
}

function populateSetupList() {
  applianceList.innerHTML = '';
  appliances.forEach(a => {
    applianceList.innerHTML += `<li>${a.name} - ${a.power} W</li>`;
  });
  maxLimitInput.value = maxLimit || '';
}

function saveSetup() {
  maxLimit = Number(maxLimitInput.value || 0);
  saveStorage(KEY_APPLIANCES, appliances);
  localStorage.setItem(KEY_LIMIT, maxLimit);
  setupSection.style.display = 'none';
  monitorSection.style.display = 'block';
  populateMonitorAppliances();
}

// ================== MONITOR FUNCTIONS ==================
function populateMonitorAppliances() {
  monitorAppliances.innerHTML = '';
  appliances.forEach(a => {
    monitorAppliances.innerHTML +=
      `<label><input type="checkbox" value="${a.name}"> ${a.name} (${a.power} W)</label><br>`;
  });
}

function startMonitoring() {
  selectedAppliances = [...document.querySelectorAll('#monitorAppliances input:checked')]
    .map(i => i.value);

  if (!selectedAppliances.length) return alert("Select appliances");

  secondsPassed = 0;
  limitCrossedThisSession = false;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    secondsPassed++;
    timer.innerText = formatHMS(secondsPassed);
  }, 1000);
}

function stopMonitoring() {
  clearInterval(timerInterval);
  const energyUsed = calculateEnergyWh();

  history.push({
    ts: new Date().toISOString(),
    energy: Number(energyUsed.toFixed(2)),
    appliances: [...selectedAppliances]
  });

  saveStorage(KEY_HISTORY, history);
  resultsButtons.style.display = 'block';

  // Check if monthly limit exceeded
  if (energyUsed > maxLimit && !limitCrossedThisSession && maxLimit > 0) {
    alert(`⚠️ Warning! Energy limit exceeded for this session.`);
    limitCrossedThisSession = true;
  }

  generateNotifications();
}

// ================== ENERGY CALCULATION ==================
function calculateEnergyWh() {
  let totalPower = 0;
  selectedAppliances.forEach(name => {
    const app = appliances.find(a => a.name === name);
    if (app) totalPower += app.power;
  });
  // Energy in Wh = (Power in W * Time in seconds) / 3600
  return (totalPower * secondsPassed) / 3600;
}

// ================== GRAPH FUNCTIONS ==================
function showGraph() {
  graphHeader.style.display = 'block';
  energyChart.style.display = 'block';
  pieWrapper.style.display = 'block';
  createGraphFromHistory();
  createPieChart();
}

function createGraphFromHistory() {
  const ctx = energyChart.getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: history.map(h => new Date(h.ts).toLocaleTimeString()),
      datasets: [{
        label: 'Energy (Wh)',
        data: history.map(h => h.energy),
        borderColor: '#35f8ff',
        tension: 0.3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

function createPieChart() {
  const ctx = appliancePieChart.getContext('2d');
  if (pieChart) pieChart.destroy();

  const labels = [];
  const data = [];
  const colors = [];

  selectedAppliances.forEach((name, i) => {
    const app = appliances.find(a => a.name === name);
    if (app) {
      labels.push(app.name);
      data.push(app.power);
      colors.push(`hsl(${i * 70}, 100%, 50%)`);
    }
  });

  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// ================== SUGGESTIONS & NOTIFICATIONS ==================
function generateSuggestions() {
  suggestionsBox.innerHTML = '';
  if (!history.length) return suggestionsBox.innerHTML = '<p>No history yet</p>';

  const usageCount = {};
  history.forEach(h => {
    h.appliances.forEach(app => {
      usageCount[app] = (usageCount[app] || 0) + 1;
    });
  });

  const sortedApps = Object.entries(usageCount).sort((a, b) => b[1] - a[1]);
  const topApp = sortedApps[0][0];

  suggestionsBox.innerHTML = `<p>💡 Appliance used most: <b>${topApp}</b></p>`;
}

function generateNotifications() {
  notificationsBox.innerHTML = '';
  notifications = [];
  history.slice(-3).forEach(h => {
    notifications.push(`Used ${h.appliances.join(', ')} for ${h.energy.toFixed(2)} Wh at ${new Date(h.ts).toLocaleTimeString()}`);
  });
  saveStorage(KEY_NOTIFS, notifications);

  notifications.forEach(n => {
    const div = document.createElement('div');
    div.className = 'notif';
    div.innerText = n;
    notificationsBox.appendChild(div);
  });
}

// ================== SUGGESTIONS ==================
function showSuggestionBox() {
  suggestionsBox.style.display = 'block';
  suggestionsBox.innerHTML = '';

  if (!history.length) {
    suggestionsBox.innerHTML = '<p>No usage history yet</p>';
    return;
  }

  // Calculate total energy per appliance
  const energyUsage = {};
  history.forEach(session => {
    session.appliances.forEach(appName => {
      const app = appliances.find(a => a.name === appName);
      if (app) {
        energyUsage[appName] = (energyUsage[appName] || 0) + (app.power * (session.energy * 3600) / app.power); // Corrected
      }
    });
  });

  // Find maximum energy consumed
  const maxEnergy = Math.max(...Object.values(energyUsage));

  // Get all appliances with max energy
  const topAppliances = Object.entries(energyUsage)
    .filter(([name, energy]) => energy === maxEnergy)
    .map(([name]) => name);

  suggestionsBox.innerHTML = `<p>💡 Highest energy consuming appliance(s): <b>${topAppliances.join(', ')}</b></p>`;
}


// ================== NOTIFICATIONS ==================
function showNotificationsBox() {
  notificationsBox.style.display = 'block';
  notificationsBox.innerHTML = '';

  if (!notifications.length) {
    notificationsBox.innerHTML = '<p>No notifications</p>';
    return;
  }

  notifications.forEach(n => {
    const div = document.createElement('div');
    div.className = 'notif';
    div.innerText = n;
    notificationsBox.appendChild(div);
  });
}

// Call this after stopMonitoring if limit crossed
function generateNotificationIfLimitCrossed(energyUsed) {
  if (maxLimit > 0 && energyUsed > maxLimit) {
    const message = `⚠️ Energy limit crossed! Used ${energyUsed.toFixed(2)} Wh`;
    notifications.push(message);
    saveStorage(KEY_NOTIFS, notifications);
  }
}


// ================== CLEAR & LOGOUT ==================
function _clearAll() {
  if (confirm("Clear all data?")) {
    localStorage.clear();
    location.reload();
  }
}

function logout() {
  location.href = 'login.html';
}
