/* ===========================================
   DATA PIPELINE COMPLIANCE - APP.JS
   =========================================== */

// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('pageTitle');
const refreshBtn = document.getElementById('refreshBtn');
const databaseModal = document.getElementById('databaseModal');
const toast = document.getElementById('toast');

// Service URLs
const SERVICE_URLS = {
    airflow: 'http://localhost:8080',
    spark: 'http://localhost:8081',
    grafana: 'http://localhost:3000',
    jupyter: 'http://localhost:8888',
    postgres: 'postgresql://airflow:airflow@localhost:5432/airflow'
};

// Page Titles
const PAGE_TITLES = {
    dashboard: 'Dashboard',
    pipeline: 'Visualização do Pipeline',
    airflow: 'Apache Airflow',
    spark: 'Apache Spark',
    grafana: 'Grafana',
    jupyter: 'Jupyter Notebooks',
    database: 'PostgreSQL',
    validation: 'Validação de Qualidade',
    settings: 'Configurações'
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Charts
    initializeCharts();

    // Initialize DAG Visualization
    initializeDAGVisualization();

    // Set up event listeners
    setupEventListeners();

    // Start auto-refresh if enabled
    startAutoRefresh();

    // Check service status
    checkServicesStatus();

    console.log('Data Pipeline Compliance UI initialized successfully');
}

// ===========================================
// EVENT LISTENERS
// ===========================================

function setupEventListeners() {
    // Sidebar toggle
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', toggleSidebarCollapse);
    }

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshData);
    }

    // Modal close on outside click
    window.addEventListener('click', function(e) {
        if (e.target === databaseModal) {
            closeDatabaseModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Escape to close modal
        if (e.key === 'Escape' && databaseModal.classList.contains('active')) {
            closeDatabaseModal();
        }

        // Ctrl + R to refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshData();
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    // Settings changes
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', changeTheme);
    }

    const autoRefreshToggle = document.getElementById('autoRefresh');
    if (autoRefreshToggle) {
        autoRefreshToggle.addEventListener('change', toggleAutoRefresh);
    }
}

// ===========================================
// NAVIGATION
// ===========================================

function navigateToPage(pageId) {
    // Update active nav item
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });

    // Update active page
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === `${pageId}-page`) {
            page.classList.add('active');
        }
    });

    // Update page title
    if (pageTitle && PAGE_TITLES[pageId]) {
        pageTitle.textContent = PAGE_TITLES[pageId];
    }

    // Update URL hash
    window.location.hash = pageId;

    // Load page-specific data
    loadPageData(pageId);
}

function toggleSidebarCollapse() {
    sidebar.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

// ===========================================
// DATA LOADING
// ===========================================

function loadPageData(pageId) {
    switch(pageId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'pipeline':
            loadPipelineData();
            break;
        case 'airflow':
            loadAirflowData();
            break;
        case 'spark':
            loadSparkData();
            break;
        case 'grafana':
            // Grafana data is loaded via iframe
            break;
        case 'jupyter':
            loadJupyterData();
            break;
        case 'database':
            loadDatabaseData();
            break;
        case 'validation':
            loadValidationData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

function loadDashboardData() {
    // Simulate loading dashboard data
    console.log('Loading dashboard data...');

    // Update stats with animation
    animateValue('successRate', 0, 98.5, 1000, '%');
    animateValue('totalTransactions', 0, 1234567, 1500);
    animateValue('highRiskCount', 0, 47, 800);

    // Update charts
    updateCharts();
}

function loadPipelineData() {
    console.log('Loading pipeline data...');
    // Pipeline data is static in this demo
}

function loadAirflowData() {
    console.log('Loading Airflow data...');
    // Refresh DAG status
}

function loadSparkData() {
    console.log('Loading Spark data...');
    // Refresh job status
}

function loadJupyterData() {
    console.log('Loading Jupyter data...');
    // Refresh notebook list
}

function loadDatabaseData() {
    console.log('Loading database data...');
    // Refresh table list
}

function loadValidationData() {
    console.log('Loading validation data...');
    // Refresh test results
}

function loadSettingsData() {
    console.log('Loading settings data...');
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }
}

// ===========================================
// CHARTS
// ===========================================

function initializeCharts() {
    // Risk Chart
    const riskCtx = document.getElementById('riskChart');
    if (riskCtx) {
        window.riskChart = new Chart(riskCtx, {
            type: 'doughnut',
            data: {
                labels: ['Alto Risco', 'Médio Risco', 'Baixo Risco'],
                datasets: [{
                    data: [47, 234, 953],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#10b981'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    // Volume Chart
    const volumeCtx = document.getElementById('volumeChart');
    if (volumeCtx) {
        window.volumeChart = new Chart(volumeCtx, {
            type: 'line',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Transações',
                    data: [120000, 190000, 150000, 180000, 220000, 140000, 160000],
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (window.riskChart) {
        // Update with random data for demo
        const newData = [
            Math.floor(Math.random() * 50) + 30,
            Math.floor(Math.random() * 250) + 200,
            Math.floor(Math.random() * 1000) + 900
        ];
        window.riskChart.data.datasets[0].data = newData;
        window.riskChart.update();
    }

    if (window.volumeChart) {
        // Update with random data for demo
        const newData = Array.from({length: 7}, () => Math.floor(Math.random() * 150000) + 100000);
        window.volumeChart.data.datasets[0].data = newData;
        window.volumeChart.update();
    }
}

// ===========================================
// DAG VISUALIZATION
// ===========================================

function initializeDAGVisualization() {
    const dagContainer = document.getElementById('dagContainer');
    if (!dagContainer) return;

    // Create DAG visualization
    const dagHTML = `
        <div class="dag-flow">
            <div class="dag-node start">
                <div class="node-label">Início</div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-node task success">
                <div class="node-label">log_execution_start</div>
                <div class="node-status">✓</div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-group">
                <div class="group-label">ingestion</div>
                <div class="group-tasks">
                    <div class="dag-node task success">
                        <div class="node-label">ingest_raw_data</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">validate_ingestion</div>
                        <div class="node-status">✓</div>
                    </div>
                </div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-group">
                <div class="group-label">transformation</div>
                <div class="group-tasks">
                    <div class="dag-node task success">
                        <div class="node-label">dbt_run_staging</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">dbt_test_staging</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">dbt_run_intermediate</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">dbt_test_intermediate</div>
                        <div class="node-status">✓</div>
                    </div>
                </div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-group">
                <div class="group-label">validation</div>
                <div class="group-tasks">
                    <div class="dag-node task success">
                        <div class="node-label">run_great_expectations</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">check_data_quality</div>
                        <div class="node-status">✓</div>
                    </div>
                </div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-group">
                <div class="group-label">final_load</div>
                <div class="group-tasks">
                    <div class="dag-node task success">
                        <div class="node-label">dbt_run_mart</div>
                        <div class="node-status">✓</div>
                    </div>
                    <div class="dag-node task success">
                        <div class="node-label">dbt_test_mart</div>
                        <div class="node-status">✓</div>
                    </div>
                </div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-node task success">
                <div class="node-label">log_execution_end</div>
                <div class="node-status">✓</div>
            </div>
            <div class="dag-arrow">→</div>
            <div class="dag-node end">
                <div class="node-label">Fim</div>
            </div>
        </div>
    `;

    dagContainer.innerHTML = dagHTML;

    // Add DAG styles
    const dagStyles = document.createElement('style');
    dagStyles.textContent = `
        .dag-flow {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .dag-node {
            padding: 12px 16px;
            border-radius: 8px;
            background: #f1f5f9;
            border: 2px solid #e2e8f0;
            text-align: center;
            min-width: 100px;
        }

        .dag-node.start,
        .dag-node.end {
            background: #dbeafe;
            border-color: #2563eb;
        }

        .dag-node.task.success {
            background: #d1fae5;
            border-color: #10b981;
        }

        .dag-node.task.running {
            background: #fef3c7;
            border-color: #f59e0b;
        }

        .dag-node.task.failed {
            background: #fee2e2;
            border-color: #ef4444;
        }

        .node-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #1e293b;
        }

        .node-status {
            font-size: 1rem;
            margin-top: 4px;
        }

        .dag-arrow {
            color: #94a3b8;
            font-size: 1.5rem;
        }

        .dag-group {
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 12px;
        }

        .group-label {
            font-size: 0.75rem;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
            text-align: center;
        }

        .group-tasks {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
    `;
    document.head.appendChild(dagStyles);
}

// ===========================================
// SERVICE STATUS
// ===========================================

function checkServicesStatus() {
    // In a real app, you would make API calls to check service status
    // For demo purposes, we'll simulate the status

    const services = ['airflow', 'spark', 'grafana', 'jupyter', 'postgres', 'redis'];

    services.forEach(service => {
        const serviceCard = document.getElementById(`service-${service}`);
        if (serviceCard) {
            // Simulate random status (mostly online)
            const isOnline = Math.random() > 0.1;
            updateServiceStatus(service, isOnline);
        }
    });
}

function updateServiceStatus(service, isOnline) {
    const serviceCard = document.getElementById(`service-${service}`);
    if (!serviceCard) return;

    const statusDot = serviceCard.querySelector('.status-dot');
    const statusText = serviceCard.querySelector('.service-status span:last-child');

    if (isOnline) {
        serviceCard.classList.remove('offline');
        serviceCard.classList.add('online');
        if (statusDot) statusDot.classList.remove('offline');
        if (statusDot) statusDot.classList.add('online');
        if (statusText) statusText.textContent = 'Online';
    } else {
        serviceCard.classList.remove('online');
        serviceCard.classList.add('offline');
        if (statusDot) statusDot.classList.remove('online');
        if (statusDot) statusDot.classList.add('offline');
        if (statusText) statusText.textContent = 'Offline';
    }
}

// ===========================================
// MODALS
// ===========================================

function showDatabaseModal() {
    if (databaseModal) {
        databaseModal.classList.add('active');
    }
}

function closeDatabaseModal() {
    if (databaseModal) {
        databaseModal.classList.remove('active');
    }
}

function connectToDatabase() {
    const host = document.getElementById('dbHost').value;
    const port = document.getElementById('dbPort').value;
    const dbName = document.getElementById('dbName').value;
    const user = document.getElementById('dbUser').value;
    const password = document.getElementById('dbPassword').value;

    // Simulate connection
    showToast('success', 'Conectado!', `Conexão estabelecida com ${host}:${port}/${dbName}`);
    closeDatabaseModal();
}

// ===========================================
// TOAST NOTIFICATIONS
// ===========================================

function showToast(type, title, message) {
    if (!toast) return;

    const toastIcon = toast.querySelector('.toast-icon i');
    const toastTitle = toast.querySelector('.toast-message h4');
    const toastMessage = toast.querySelector('.toast-message p');

    // Update icon based on type
    if (toastIcon) {
        toastIcon.className = '';
        switch(type) {
            case 'success':
                toastIcon.className = 'fas fa-check-circle';
                toast.querySelector('.toast-icon').style.background = 'rgba(16, 185, 129, 0.1)';
                toast.querySelector('.toast-icon').style.color = '#10b981';
                break;
            case 'error':
                toastIcon.className = 'fas fa-exclamation-circle';
                toast.querySelector('.toast-icon').style.background = 'rgba(239, 68, 68, 0.1)';
                toast.querySelector('.toast-icon').style.color = '#ef4444';
                break;
            case 'warning':
                toastIcon.className = 'fas fa-exclamation-triangle';
                toast.querySelector('.toast-icon').style.background = 'rgba(245, 158, 11, 0.1)';
                toast.querySelector('.toast-icon').style.color = '#f59e0b';
                break;
            case 'info':
                toastIcon.className = 'fas fa-info-circle';
                toast.querySelector('.toast-icon').style.background = 'rgba(59, 130, 246, 0.1)';
                toast.querySelector('.toast-icon').style.color = '#3b82f6';
                break;
        }
    }

    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;

    // Show toast
    toast.classList.add('show');

    // Auto-hide after 3 seconds
    setTimeout(() => {
        hideToast();
    }, 3000);
}

function hideToast() {
    if (toast) {
        toast.classList.remove('show');
    }
}

// ===========================================
// ACTIONS
// ===========================================

function refreshData() {
    // Add spinning animation to refresh button
    const refreshIcon = refreshBtn.querySelector('i');
    if (refreshIcon) {
        refreshIcon.style.animation = 'spin 1s linear';
    }

    // Reload current page data
    const activePage = document.querySelector('.nav-item.active');
    if (activePage) {
        const pageId = activePage.getAttribute('data-page');
        loadPageData(pageId);
    }

    // Show toast
    showToast('info', 'Atualizando...', 'Dados estão sendo atualizados');

    // Remove animation after 1 second
    setTimeout(() => {
        if (refreshIcon) {
            refreshIcon.style.animation = '';
        }
        showToast('success', 'Atualizado!', 'Dados atualizados com sucesso');
    }, 1000);
}

function refreshAirflowData() {
    showToast('info', 'Atualizando Airflow...', 'Buscando DAGs atualizadas');
    setTimeout(() => {
        showToast('success', 'Airflow Atualizado!', 'DAGs atualizadas com sucesso');
    }, 1500);
}

function executeQuery() {
    const queryInput = document.getElementById('queryInput');
    const queryResult = document.getElementById('queryResult');

    if (!queryInput || !queryResult) return;

    const query = queryInput.value.trim();

    if (!query) {
        showToast('warning', 'Atenção', 'Digite uma query para executar');
        return;
    }

    // Simulate query execution
    queryResult.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Executando query...</div>';

    setTimeout(() => {
        // Simulate results
        const mockResults = `
            <div style="font-family: monospace; font-size: 0.85rem;">
                <div style="margin-bottom: 12px; color: #10b981;">
                    <i class="fas fa-check-circle"></i> Query executada com sucesso
                </div>
                <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #e2e8f0;">
                                <th style="padding: 8px; text-align: left;">transaction_id</th>
                                <th style="padding: 8px; text-align: left;">entity_id</th>
                                <th style="padding: 8px; text-align: left;">amount</th>
                                <th style="padding: 8px; text-align: left;">risk_score</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="padding: 8px;">TXN_001</td>
                                <td style="padding: 8px;">ENT_001</td>
                                <td style="padding: 8px;">$15,000.00</td>
                                <td style="padding: 8px;">45</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;">TXN_002</td>
                                <td style="padding: 8px;">ENT_002</td>
                                <td style="padding: 8px;">$8,500.00</td>
                                <td style="padding: 8px;">32</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px;">TXN_003</td>
                                <td style="padding: 8px;">ENT_001</td>
                                <td style="padding: 8px;">$125,000.00</td>
                                <td style="padding: 8px;">78</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div style="margin-top: 12px; color: #64748b; font-size: 0.8rem;">
                    3 linhas retornadas em 0.234 segundos
                </div>
            </div>
        `;

        queryResult.innerHTML = mockResults;
        showToast('success', 'Query Executada!', '3 linhas retornadas');
    }, 1500);
}

function runValidation() {
    showToast('info', 'Executando Validação...', 'Great Expectations está rodando os testes');

    setTimeout(() => {
        showToast('success', 'Validação Completa!', '15/15 testes passaram');
    }, 2000);
}

function viewExpectations() {
    showToast('info', 'Expectativas', 'Abrindo documentação das expectativas');
}

function createNewNotebook() {
    showToast('info', 'Criando Notebook...', 'Novo notebook será criado no Jupyter');

    setTimeout(() => {
        window.open('http://localhost:8888', '_blank');
    }, 500);
}

function saveSettings() {
    const themeSelect = document.getElementById('themeSelect');
    const autoRefresh = document.getElementById('autoRefresh');
    const notifications = document.getElementById('notifications');

    if (themeSelect) {
        localStorage.setItem('theme', themeSelect.value);
        changeTheme();
    }

    if (autoRefresh) {
        localStorage.setItem('autoRefresh', autoRefresh.checked);
    }

    if (notifications) {
        localStorage.setItem('notifications', notifications.checked);
    }

    showToast('success', 'Configurações Salvas!', 'Suas preferências foram salvas');
}

function resetSettings() {
    localStorage.removeItem('theme');
    localStorage.removeItem('autoRefresh');
    localStorage.removeItem('notifications');

    const themeSelect = document.getElementById('themeSelect');
    const autoRefresh = document.getElementById('autoRefresh');
    const notifications = document.getElementById('notifications');

    if (themeSelect) themeSelect.value = 'light';
    if (autoRefresh) autoRefresh.checked = true;
    if (notifications) notifications.checked = true;

    changeTheme();

    showToast('info', 'Configurações Restauradas!', 'Configurações padrão foram restauradas');
}

// ===========================================
// THEME
// ===========================================

function changeTheme() {
    const themeSelect = document.getElementById('themeSelect');
    if (!themeSelect) return;

    const theme = themeSelect.value;

    // In a real app, you would apply the theme here
    // For now, just save the preference
    localStorage.setItem('theme', theme);

    console.log('Theme changed to:', theme);
}

// ===========================================
// AUTO REFRESH
// ===========================================

let autoRefreshInterval = null;

function startAutoRefresh() {
    const autoRefreshEnabled = localStorage.getItem('autoRefresh') !== 'false';

    if (autoRefreshEnabled) {
        autoRefreshInterval = setInterval(() => {
            // Refresh dashboard data every 30 seconds
            const activePage = document.querySelector('.nav-item.active');
            if (activePage && activePage.getAttribute('data-page') === 'dashboard') {
                updateCharts();
            }
        }, 30000);
    }
}

function toggleAutoRefresh() {
    const autoRefresh = document.getElementById('autoRefresh');
    if (!autoRefresh) return;

    if (autoRefresh.checked) {
        startAutoRefresh();
        showToast('info', 'Auto-Refresh Ativado', 'Dados serão atualizados a cada 30 segundos');
    } else {
        if (autoRefreshInterval) {
            clearInterval(autoRefreshInterval);
            autoRefreshInterval = null;
        }
        showToast('info', 'Auto-Refresh Desativado', 'Atualização automática foi desativada');
    }
}

// ===========================================
// SEARCH
// ===========================================

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();

    if (!searchTerm) return;

    // Search through navigation items
    navItems.forEach(item => {
        const pageName = item.getAttribute('data-page');
        const pageTitle = PAGE_TITLES[pageName].toLowerCase();

        if (pageTitle.includes(searchTerm)) {
            item.style.display = 'block';
            item.style.background = 'rgba(37, 99, 235, 0.1)';
        } else {
            item.style.background = '';
        }
    });

    console.log('Searching for:', searchTerm);
}

// ===========================================
// UTILITIES
// ===========================================

function animateValue(elementId, start, end, duration, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);

        const current = start + (end - start) * easeOutQuad;

        if (suffix === '%') {
            element.textContent = current.toFixed(1) + suffix;
        } else if (end > 10000) {
            element.textContent = Math.floor(current).toLocaleString('pt-BR') + suffix;
        } else {
            element.textContent = Math.floor(current) + suffix;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatNumber(number) {
    return new Intl.NumberFormat('pt-BR').format(number);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// ===========================================
// KEYBOARD SHORTCUTS INFO
// ===========================================

function showKeyboardShortcuts() {
    const shortcuts = `
        <div style="font-size: 0.9rem;">
            <h4 style="margin-bottom: 12px;">Atalhos de Teclado</h4>
            <div><strong>Ctrl + R</strong> - Atualizar dados</div>
            <div><strong>Esc</strong> - Fechar modal</div>
        </div>
    `;

    showToast('info', 'Atalhos', shortcuts);
}

// ===========================================
// INITIAL LOAD
// ===========================================

// Handle initial page load based on URL hash
if (window.location.hash) {
    const pageId = window.location.hash.substring(1);
    if (PAGE_TITLES[pageId]) {
        navigateToPage(pageId);
    }
}

// Restore sidebar state
const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
if (sidebarCollapsed) {
    sidebar.classList.add('collapsed');
}

// Log app ready
console.log('Data Pipeline Compliance UI - Ready');
console.log('Version: 1.0.0');
console.log('Last Updated: 2026-03-30');
