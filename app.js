// ===== ExpenseWise — Smart Expense Tracker =====

// ===== CONSTANTS & HELPERS =====
const CATEGORIES = {
    food: { label: 'Food & Groceries', emoji: '🍕', color: '#fb7185' },
    transport: { label: 'Transportation', emoji: '🚗', color: '#4facfe' },
    rent: { label: 'Rent / Housing', emoji: '🏠', color: '#a855f7' },
    utilities: { label: 'Utilities', emoji: '💡', color: '#fbbf24' },
    internet: { label: 'Internet & Phone', emoji: '📡', color: '#38bdf8' },
    entertainment: { label: 'Entertainment', emoji: '🎬', color: '#f472b6' },
    shopping: { label: 'Shopping & Clothing', emoji: '🛍️', color: '#fb923c' },
    health: { label: 'Health & Medical', emoji: '🏥', color: '#34d399' },
    education: { label: 'Education', emoji: '📚', color: '#60a5fa' },
    personal: { label: 'Personal Care', emoji: '💇', color: '#e879f9' },
    subscriptions: { label: 'Subscriptions', emoji: '📺', color: '#a78bfa' },
    dining: { label: 'Dining Out', emoji: '🍽️', color: '#f87171' },
    fuel: { label: 'Fuel', emoji: '⛽', color: '#a3e635' },
    emi: { label: 'EMI / Loans', emoji: '🏦', color: '#2dd4bf' },
    insurance: { label: 'Insurance', emoji: '🛡️', color: '#818cf8' },
    gifts: { label: 'Gifts & Donations', emoji: '🎁', color: '#fdba74' },
    travel: { label: 'Travel', emoji: '✈️', color: '#7dd3fc' },
    misc: { label: 'Miscellaneous', emoji: '📦', color: '#94a3b8' },
};

const PAYMENT_LABELS = {
    cash: '💵 Cash',
    upi: '📱 UPI',
    debit: '💳 Debit Card',
    credit: '💳 Credit Card',
    netbanking: '🏦 Net Banking',
    wallet: '👛 Wallet',
};

const GRADIENTS = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#a18cd1', '#fbc2eb',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fad0c4',
    '#84fab0', '#8fd3f4',
];

function formatCurrency(amount) {
    return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateShort(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getToday() {
    return new Date().toISOString().split('T')[0];
}

function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getMonthStart(date = new Date()) {
    const d = new Date(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===== DATA STORE =====
class ExpenseStore {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('ew_expenses') || '[]');
        this.income = parseFloat(localStorage.getItem('ew_income') || '0');
        this.savingsTarget = parseInt(localStorage.getItem('ew_savings_target') || '20');
        this.budgets = JSON.parse(localStorage.getItem('ew_budgets') || '{}');
    }

    save() {
        localStorage.setItem('ew_expenses', JSON.stringify(this.expenses));
        localStorage.setItem('ew_income', this.income.toString());
        localStorage.setItem('ew_savings_target', this.savingsTarget.toString());
        localStorage.setItem('ew_budgets', JSON.stringify(this.budgets));
    }

    addExpense(expense) {
        expense.id = generateId();
        expense.createdAt = new Date().toISOString();
        this.expenses.push(expense);
        this.save();
        return expense;
    }

    updateExpense(id, data) {
        const idx = this.expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            this.expenses[idx] = { ...this.expenses[idx], ...data };
            this.save();
        }
    }

    deleteExpense(id) {
        this.expenses = this.expenses.filter(e => e.id !== id);
        this.save();
    }

    getExpenses(filter = {}) {
        let result = [...this.expenses];

        if (filter.dateFrom) {
            result = result.filter(e => e.date >= filter.dateFrom);
        }
        if (filter.dateTo) {
            result = result.filter(e => e.date <= filter.dateTo);
        }
        if (filter.category && filter.category !== 'all') {
            result = result.filter(e => e.category === filter.category);
        }
        if (filter.month) {
            result = result.filter(e => e.date.substring(0, 7) === filter.month);
        }

        return result.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    }

    getTotalByPeriod(period) {
        const today = new Date();
        let from;

        if (period === 'today') {
            from = getToday();
            return this.expenses
                .filter(e => e.date === from)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        } else if (period === 'week') {
            from = getWeekStart().toISOString().split('T')[0];
        } else if (period === 'month') {
            from = getMonthStart().toISOString().split('T')[0];
        }

        return this.expenses
            .filter(e => e.date >= from)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
    }

    getCategoryTotals(month) {
        const expenses = month
            ? this.expenses.filter(e => e.date.substring(0, 7) === month)
            : this.expenses;

        const totals = {};
        expenses.forEach(e => {
            totals[e.category] = (totals[e.category] || 0) + parseFloat(e.amount);
        });
        return totals;
    }

    getDailyTotals(month) {
        const expenses = month
            ? this.expenses.filter(e => e.date.substring(0, 7) === month)
            : this.expenses;

        const totals = {};
        expenses.forEach(e => {
            totals[e.date] = (totals[e.date] || 0) + parseFloat(e.amount);
        });
        return totals;
    }

    getWeeklyTotals(month) {
        const expenses = month
            ? this.expenses.filter(e => e.date.substring(0, 7) === month)
            : this.expenses;

        const weeks = {};
        expenses.forEach(e => {
            const d = new Date(e.date);
            const weekStart = getWeekStart(d);
            const key = weekStart.toISOString().split('T')[0];
            weeks[key] = (weeks[key] || 0) + parseFloat(e.amount);
        });
        return weeks;
    }

    getAvailableMonths() {
        const months = new Set();
        this.expenses.forEach(e => months.add(e.date.substring(0, 7)));
        return Array.from(months).sort().reverse();
    }
}

// ===== CHART MANAGER =====
class ChartManager {
    constructor() {
        this.charts = {};
    }

    destroy(id) {
        if (this.charts[id]) {
            this.charts[id].destroy();
            delete this.charts[id];
        }
    }

    createDoughnut(canvasId, labels, data, colors) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8888aa',
                            padding: 12,
                            font: { size: 11 },
                            usePointStyle: true,
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
                        }
                    }
                }
            }
        });
    }

    createLine(canvasId, labels, data, label = 'Amount', color = '#667eea') {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label,
                    data,
                    borderColor: color,
                    backgroundColor: color + '20',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: color,
                    pointBorderWidth: 0,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8888aa', font: { size: 10 } },
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            color: '#8888aa',
                            font: { size: 10 },
                            callback: v => '₹' + v.toLocaleString('en-IN'),
                        },
                        beginAtZero: true,
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => formatCurrency(ctx.parsed.y)
                        }
                    }
                }
            }
        });
    }

    createBar(canvasId, labels, datasets) {
        this.destroy(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#8888aa', font: { size: 10 } },
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: {
                            color: '#8888aa',
                            font: { size: 10 },
                            callback: v => '₹' + v.toLocaleString('en-IN'),
                        },
                        beginAtZero: true,
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#8888aa', font: { size: 11 }, usePointStyle: true },
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
                        }
                    }
                }
            }
        });
    }
}

// ===== APP =====
class ExpenseApp {
    constructor() {
        this.store = new ExpenseStore();
        this.charts = new ChartManager();
        this.currentView = 'daily';
        this.currentSection = 'dashboard';
        this.init();
    }

    init() {
        this.bindEvents();
        this.setDefaults();
        this.navigateTo('dashboard');
    }

    setDefaults() {
        document.getElementById('expenseDate').value = getToday();
        document.getElementById('currentDate').textContent =
            new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        // Set filter month to current month
        const now = new Date();
        const monthStr = now.toISOString().substring(0, 7);
        document.getElementById('filterMonth').value = monthStr;

        // Load saved income & savings target
        document.getElementById('monthlyIncome').value = this.store.income || '';
        document.getElementById('savingsTarget').value = this.store.savingsTarget;
        document.getElementById('savingsTargetValue').textContent = this.store.savingsTarget + '%';

        this.populateAnalyticsMonths();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link, [data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                if (section) this.navigateTo(section);
            });
        });

        // Mobile menu
        const mobileBtn = document.createElement('button');
        mobileBtn.className = 'mobile-menu-btn';
        mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(mobileBtn);

        mobileBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Close sidebar on link click (mobile)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                document.getElementById('sidebar').classList.remove('open');
            });
        });

        // Expense Form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Quick Add Presets
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const expense = {
                    date: getToday(),
                    amount: parseFloat(btn.dataset.amount),
                    category: btn.dataset.category,
                    note: btn.dataset.note,
                    payment: 'upi',
                };
                this.store.addExpense(expense);
                this.showToast(`Quick add: ${btn.dataset.note} — ${formatCurrency(btn.dataset.amount)}`);
                this.refreshAll();
            });
        });

        // View Tabs
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentView = tab.dataset.view;
                this.renderTransactions();
            });
        });

        // Filters
        document.getElementById('filterCategory').addEventListener('change', () => this.renderTransactions());
        document.getElementById('filterMonth').addEventListener('change', () => this.renderTransactions());
        document.getElementById('clearFilters').addEventListener('click', () => {
            document.getElementById('filterCategory').value = 'all';
            document.getElementById('filterMonth').value = new Date().toISOString().substring(0, 7);
            this.currentView = 'daily';
            document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.view-tab[data-view="daily"]').classList.add('active');
            this.renderTransactions();
        });

        // Analytics month selector
        document.getElementById('analyticsMonth').addEventListener('change', () => this.renderAnalytics());

        // Income
        document.getElementById('saveIncome').addEventListener('click', () => {
            const income = parseFloat(document.getElementById('monthlyIncome').value) || 0;
            this.store.income = income;
            this.store.save();
            this.showToast('Monthly income saved!');
            this.updateBudgetSection();
        });

        // Savings target slider
        document.getElementById('savingsTarget').addEventListener('input', (e) => {
            const val = e.target.value;
            document.getElementById('savingsTargetValue').textContent = val + '%';
            this.store.savingsTarget = parseInt(val);
            this.store.save();
            this.updateBudgetSection();
        });

        // Save budgets
        document.getElementById('saveBudgets').addEventListener('click', () => {
            this.saveBudgets();
        });

        // Edit modal
        document.getElementById('closeModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('editForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEdit();
        });

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => this.exportCSV());

        // Import
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importCSV(e));

        // Close modal on overlay click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeEditModal();
            }
        });
    }

    navigateTo(section) {
        this.currentSection = section;

        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById('section-' + section).classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelector(`.nav-link[data-section="${section}"]`)?.classList.add('active');

        this.refreshSection(section);
    }

    refreshSection(section) {
        switch (section) {
            case 'dashboard': this.renderDashboard(); break;
            case 'transactions': this.renderTransactions(); break;
            case 'analytics': this.renderAnalytics(); break;
            case 'budget': this.renderBudget(); break;
            case 'advisor': this.renderAdvisor(); break;
        }
    }

    refreshAll() {
        this.refreshSection(this.currentSection);
    }

    // ===== ADD EXPENSE =====
    addExpense() {
        const expense = {
            date: document.getElementById('expenseDate').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            category: document.getElementById('expenseCategory').value,
            payment: document.getElementById('expensePayment').value,
            note: document.getElementById('expenseNote').value,
        };

        this.store.addExpense(expense);
        this.showToast('Expense added: ' + formatCurrency(expense.amount));
        document.getElementById('expenseForm').reset();
        document.getElementById('expenseDate').value = getToday();
        this.refreshAll();
    }

    // ===== DASHBOARD =====
    renderDashboard() {
        const todayTotal = this.store.getTotalByPeriod('today');
        const weekTotal = this.store.getTotalByPeriod('week');
        const monthTotal = this.store.getTotalByPeriod('month');
        const savings = Math.max(0, this.store.income - monthTotal);

        document.getElementById('todayTotal').textContent = formatCurrency(todayTotal);
        document.getElementById('weekTotal').textContent = formatCurrency(weekTotal);
        document.getElementById('monthTotal').textContent = formatCurrency(monthTotal);
        document.getElementById('savingsTotal').textContent = this.store.income > 0 ? formatCurrency(savings) : '—';

        this.renderCategoryChart();
        this.renderTrendChart();
        this.renderRecentTransactions();
        this.updateQuickTip();
    }

    renderCategoryChart() {
        const month = new Date().toISOString().substring(0, 7);
        const catTotals = this.store.getCategoryTotals(month);
        const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

        if (sortedCats.length === 0) {
            this.charts.destroy('categoryChart');
            return;
        }

        const labels = sortedCats.map(([k]) => CATEGORIES[k]?.emoji + ' ' + (CATEGORIES[k]?.label || k));
        const data = sortedCats.map(([, v]) => v);
        const colors = sortedCats.map(([k]) => CATEGORIES[k]?.color || '#94a3b8');

        this.charts.createDoughnut('categoryChart', labels, data, colors);
    }

    renderTrendChart() {
        const month = new Date().toISOString().substring(0, 7);
        const dailyTotals = this.store.getDailyTotals(month);
        const sortedDays = Object.entries(dailyTotals).sort((a, b) => a[0].localeCompare(b[0]));

        if (sortedDays.length === 0) {
            this.charts.destroy('trendChart');
            return;
        }

        const labels = sortedDays.map(([d]) => formatDateShort(d));
        const data = sortedDays.map(([, v]) => v);

        this.charts.createLine('trendChart', labels, data);
    }

    renderRecentTransactions() {
        const recent = this.store.getExpenses({}).slice(0, 5);
        const container = document.getElementById('recentTransactions');

        if (recent.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No transactions yet. Start tracking your expenses!</p></div>';
            return;
        }

        container.innerHTML = recent.map(e => `
            <div class="transaction-item">
                <div class="txn-left">
                    <div class="txn-icon">${CATEGORIES[e.category]?.emoji || '📦'}</div>
                    <div class="txn-details">
                        <span class="txn-category">${CATEGORIES[e.category]?.label || e.category}</span>
                        <span class="txn-note">${e.note || '—'}</span>
                    </div>
                </div>
                <div class="txn-right">
                    <span class="txn-amount">-${formatCurrency(e.amount)}</span>
                    <span class="txn-date">${formatDate(e.date)}</span>
                </div>
            </div>
        `).join('');
    }

    updateQuickTip() {
        const tips = this.generateQuickTips();
        if (tips.length > 0) {
            const randomTip = tips[Math.floor(Math.random() * tips.length)];
            document.getElementById('quickTipText').textContent = randomTip;
        }
    }

    generateQuickTips() {
        const tips = [];
        const month = new Date().toISOString().substring(0, 7);
        const catTotals = this.store.getCategoryTotals(month);
        const monthTotal = this.store.getTotalByPeriod('month');

        if (catTotals.dining > 0 && catTotals.dining > monthTotal * 0.15) {
            tips.push(`You're spending ${Math.round(catTotals.dining / monthTotal * 100)}% on dining out. Try cooking at home 3 days a week to save ${formatCurrency(catTotals.dining * 0.4)}!`);
        }
        if (catTotals.entertainment > 0 && catTotals.entertainment > monthTotal * 0.1) {
            tips.push(`Entertainment takes ${Math.round(catTotals.entertainment / monthTotal * 100)}% of your budget. Look for free alternatives like parks, libraries, or free events.`);
        }
        if (catTotals.subscriptions > 0) {
            tips.push(`You're spending ${formatCurrency(catTotals.subscriptions)} on subscriptions. Review and cancel any you don't actively use.`);
        }
        if (this.store.income > 0 && monthTotal > this.store.income * 0.8) {
            tips.push(`⚠️ You've spent ${Math.round(monthTotal / this.store.income * 100)}% of your income this month. Consider cutting non-essential expenses.`);
        }
        if (catTotals.shopping > 0) {
            tips.push(`Try the 24-hour rule: wait a day before buying non-essentials. You might save up to 30% of your shopping budget!`);
        }
        if (tips.length === 0) {
            tips.push('Start adding your daily expenses to get personalized savings tips! 💡');
            tips.push('Track every small expense — they add up! A ₹50 tea daily = ₹1,500/month ☕');
            tips.push('Set your monthly income in Budget & Savings to see how much you can save! 🎯');
        }

        return tips;
    }

    // ===== TRANSACTIONS =====
    renderTransactions() {
        const filterCat = document.getElementById('filterCategory').value;
        const filterMonth = document.getElementById('filterMonth').value;

        let filter = { category: filterCat };

        const today = new Date();
        if (this.currentView === 'daily') {
            filter.dateFrom = getToday();
            filter.dateTo = getToday();
        } else if (this.currentView === 'weekly') {
            filter.dateFrom = getWeekStart().toISOString().split('T')[0];
            filter.dateTo = getToday();
        } else if (this.currentView === 'monthly') {
            filter.month = filterMonth || today.toISOString().substring(0, 7);
        } else {
            if (filterMonth) filter.month = filterMonth;
        }

        const expenses = this.store.getExpenses(filter);
        const tbody = document.getElementById('expenseTableBody');
        const emptyState = document.getElementById('emptyTransactions');
        const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

        document.getElementById('txnCount').textContent = `${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`;
        document.getElementById('txnTotal').textContent = `Total: ${formatCurrency(total)}`;

        if (expenses.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            document.querySelector('.expense-table').style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        document.querySelector('.expense-table').style.display = 'table';

        tbody.innerHTML = expenses.map(e => `
            <tr>
                <td>${formatDate(e.date)}</td>
                <td><span class="cat-badge cat-${e.category}">${CATEGORIES[e.category]?.emoji || ''} ${CATEGORIES[e.category]?.label || e.category}</span></td>
                <td>${e.note || '—'}</td>
                <td>${PAYMENT_LABELS[e.payment] || e.payment}</td>
                <td class="amount">-${formatCurrency(e.amount)}</td>
                <td class="actions">
                    <button class="btn-edit" onclick="app.openEditModal('${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="app.deleteExpense('${e.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }

    deleteExpense(id) {
        if (confirm('Delete this expense?')) {
            this.store.deleteExpense(id);
            this.showToast('Expense deleted');
            this.refreshAll();
        }
    }

    openEditModal(id) {
        const expense = this.store.expenses.find(e => e.id === id);
        if (!expense) return;

        document.getElementById('editId').value = expense.id;
        document.getElementById('editDate').value = expense.date;
        document.getElementById('editAmount').value = expense.amount;
        document.getElementById('editCategory').value = expense.category;
        document.getElementById('editPayment').value = expense.payment;
        document.getElementById('editNote').value = expense.note || '';

        document.getElementById('editModal').classList.add('show');
    }

    closeEditModal() {
        document.getElementById('editModal').classList.remove('show');
    }

    saveEdit() {
        const id = document.getElementById('editId').value;
        this.store.updateExpense(id, {
            date: document.getElementById('editDate').value,
            amount: parseFloat(document.getElementById('editAmount').value),
            category: document.getElementById('editCategory').value,
            payment: document.getElementById('editPayment').value,
            note: document.getElementById('editNote').value,
        });
        this.closeEditModal();
        this.showToast('Expense updated');
        this.refreshAll();
    }

    // ===== ANALYTICS =====
    populateAnalyticsMonths() {
        const select = document.getElementById('analyticsMonth');
        const months = this.store.getAvailableMonths();
        const currentMonth = new Date().toISOString().substring(0, 7);

        if (!months.includes(currentMonth)) months.unshift(currentMonth);

        select.innerHTML = months.map(m => {
            const d = new Date(m + '-01');
            const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            return `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${label}</option>`;
        }).join('');
    }

    renderAnalytics() {
        const month = document.getElementById('analyticsMonth').value;
        this.renderAnalyticsPie(month);
        this.renderWeeklyBar(month);
        this.renderDailyLine(month);
        this.renderMonthComparison();
        this.renderTopSpending(month);
    }

    renderAnalyticsPie(month) {
        const catTotals = this.store.getCategoryTotals(month);
        const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

        if (sorted.length === 0) {
            this.charts.destroy('analyticsPieChart');
            return;
        }

        this.charts.createDoughnut(
            'analyticsPieChart',
            sorted.map(([k]) => CATEGORIES[k]?.emoji + ' ' + (CATEGORIES[k]?.label || k)),
            sorted.map(([, v]) => v),
            sorted.map(([k]) => CATEGORIES[k]?.color || '#94a3b8')
        );
    }

    renderWeeklyBar(month) {
        const weeklyTotals = this.store.getWeeklyTotals(month);
        const sorted = Object.entries(weeklyTotals).sort((a, b) => a[0].localeCompare(b[0]));

        if (sorted.length === 0) {
            this.charts.destroy('weeklyBarChart');
            return;
        }

        this.charts.createBar('weeklyBarChart',
            sorted.map(([d], i) => `Week ${i + 1} (${formatDateShort(d)})`),
            [{
                label: 'Weekly Spending',
                data: sorted.map(([, v]) => v),
                backgroundColor: '#667eea80',
                borderColor: '#667eea',
                borderWidth: 1,
                borderRadius: 6,
            }]
        );
    }

    renderDailyLine(month) {
        const dailyTotals = this.store.getDailyTotals(month);
        const sorted = Object.entries(dailyTotals).sort((a, b) => a[0].localeCompare(b[0]));

        if (sorted.length === 0) {
            this.charts.destroy('dailyLineChart');
            return;
        }

        this.charts.createLine(
            'dailyLineChart',
            sorted.map(([d]) => formatDateShort(d)),
            sorted.map(([, v]) => v),
            'Daily Spending',
            '#f472b6'
        );
    }

    renderMonthComparison() {
        const months = this.store.getAvailableMonths().slice(0, 6).reverse();

        if (months.length < 2) {
            this.charts.destroy('monthCompareChart');
            return;
        }

        const totals = months.map(m =>
            this.store.expenses
                .filter(e => e.date.substring(0, 7) === m)
                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
        );

        const labels = months.map(m => {
            const d = new Date(m + '-01');
            return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
        });

        this.charts.createBar('monthCompareChart', labels, [{
            label: 'Monthly Total',
            data: totals,
            backgroundColor: totals.map((v, i) =>
                i === totals.length - 1 ? '#667eea80' : '#764ba280'
            ),
            borderColor: totals.map((v, i) =>
                i === totals.length - 1 ? '#667eea' : '#764ba2'
            ),
            borderWidth: 1,
            borderRadius: 6,
        }]);
    }

    renderTopSpending(month) {
        const catTotals = this.store.getCategoryTotals(month);
        const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const container = document.getElementById('spendingBars');

        if (sorted.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No data for this month.</p>';
            return;
        }

        const maxVal = sorted[0][1];

        container.innerHTML = sorted.map(([cat, amount]) => {
            const pct = (amount / maxVal * 100).toFixed(0);
            const color = CATEGORIES[cat]?.color || '#94a3b8';
            return `
                <div class="spending-bar-item">
                    <div class="spending-bar-header">
                        <span>${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat}</span>
                        <span>${formatCurrency(amount)}</span>
                    </div>
                    <div class="spending-bar-track">
                        <div class="spending-bar-fill" style="width: ${pct}%; background: ${color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===== BUDGET & SAVINGS =====
    renderBudget() {
        this.updateBudgetSection();
        this.renderBudgetGrid();
    }

    updateBudgetSection() {
        const income = this.store.income;
        const monthTotal = this.store.getTotalByPeriod('month');
        const remaining = income - monthTotal;
        const targetPct = this.store.savingsTarget;
        const targetAmount = income * targetPct / 100;
        const spentPct = income > 0 ? Math.min((monthTotal / income * 100), 100) : 0;

        document.getElementById('incomeDisplay').textContent = income.toLocaleString('en-IN');
        document.getElementById('spentDisplay').textContent = monthTotal.toLocaleString('en-IN');
        document.getElementById('remainingDisplay').textContent = Math.max(0, remaining).toLocaleString('en-IN');
        document.getElementById('savingsTargetAmount').textContent = targetAmount.toLocaleString('en-IN');
        document.getElementById('progressPercent').textContent = `${Math.round(spentPct)}% spent`;

        const bar = document.getElementById('savingsProgressBar');
        bar.style.width = spentPct + '%';
        bar.classList.toggle('over-budget', spentPct > (100 - targetPct));

        const targetLine = document.getElementById('savingsTargetLine');
        targetLine.style.left = (100 - targetPct) + '%';
    }

    renderBudgetGrid() {
        const grid = document.getElementById('budgetGrid');
        const month = new Date().toISOString().substring(0, 7);
        const catTotals = this.store.getCategoryTotals(month);

        grid.innerHTML = Object.entries(CATEGORIES).map(([key, cat]) => {
            const budget = this.store.budgets[key] || '';
            const spent = catTotals[key] || 0;
            const overUnder = budget ? (spent > budget ? 'over' : 'under') : '';
            const spentLabel = spent > 0 ? `Spent: ${formatCurrency(spent)}` : 'No spend';

            return `
                <div class="budget-item">
                    <label>${cat.emoji} ${cat.label}</label>
                    <input type="number" data-category="${key}" value="${budget}" placeholder="₹ Limit" min="0">
                    <span class="budget-spent ${overUnder}">${spentLabel}</span>
                </div>
            `;
        }).join('');
    }

    saveBudgets() {
        const inputs = document.querySelectorAll('#budgetGrid input[data-category]');
        inputs.forEach(input => {
            const cat = input.dataset.category;
            const val = parseFloat(input.value);
            if (val > 0) {
                this.store.budgets[cat] = val;
            } else {
                delete this.store.budgets[cat];
            }
        });
        this.store.save();
        this.showToast('Budgets saved!');
        this.renderBudgetGrid();
    }

    // ===== SMART ADVISOR =====
    renderAdvisor() {
        this.renderAnalysisCards();
        this.renderReductionSuggestions();
        this.renderMonthInsights();
        this.renderPersonalRecommendations();
    }

    renderAnalysisCards() {
        const container = document.getElementById('analysisCards');
        const month = new Date().toISOString().substring(0, 7);
        const monthTotal = this.store.getTotalByPeriod('month');
        const catTotals = this.store.getCategoryTotals(month);
        const numCategories = Object.keys(catTotals).length;
        const dailyAvg = this.getDailyAverage(month);
        const topCategory = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

        // Get previous month data
        const prevMonth = this.getPreviousMonth(month);
        const prevTotal = this.store.expenses
            .filter(e => e.date.substring(0, 7) === prevMonth)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);

        const change = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal * 100) : 0;
        const changeClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : '';
        const changeSymbol = change > 0 ? '↑' : change < 0 ? '↓' : '';

        container.innerHTML = `
            <div class="analysis-card">
                <div class="analysis-value">${formatCurrency(monthTotal)}</div>
                <div class="analysis-label">Total This Month</div>
            </div>
            <div class="analysis-card">
                <div class="analysis-value">${formatCurrency(dailyAvg)}</div>
                <div class="analysis-label">Daily Average</div>
            </div>
            <div class="analysis-card">
                <div class="analysis-value ${changeClass}">${changeSymbol} ${Math.abs(change).toFixed(1)}%</div>
                <div class="analysis-label">vs Last Month</div>
            </div>
            <div class="analysis-card">
                <div class="analysis-value">${topCategory ? CATEGORIES[topCategory[0]]?.emoji || '' : '—'}</div>
                <div class="analysis-label">${topCategory ? 'Top: ' + (CATEGORIES[topCategory[0]]?.label || topCategory[0]) : 'No data'}</div>
            </div>
            <div class="analysis-card">
                <div class="analysis-value">${numCategories}</div>
                <div class="analysis-label">Active Categories</div>
            </div>
        `;
    }

    getDailyAverage(month) {
        const now = new Date();
        const isCurrentMonth = month === now.toISOString().substring(0, 7);
        const daysInMonth = isCurrentMonth ? now.getDate() : new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).getDate();
        const total = this.store.expenses
            .filter(e => e.date.substring(0, 7) === month)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0);
        return daysInMonth > 0 ? total / daysInMonth : 0;
    }

    getPreviousMonth(month) {
        const d = new Date(month + '-01');
        d.setMonth(d.getMonth() - 1);
        return d.toISOString().substring(0, 7);
    }

    renderReductionSuggestions() {
        const container = document.getElementById('reductionSuggestions');
        const suggestions = this.generateReductionSuggestions();

        if (suggestions.length === 0) {
            container.innerHTML = '<div class="suggestion-item low"><span class="suggestion-icon">📊</span><div class="suggestion-content"><h4>Not enough data</h4><p>Keep tracking your expenses for at least a month to get personalized reduction suggestions.</p></div></div>';
            return;
        }

        container.innerHTML = suggestions.map(s => `
            <div class="suggestion-item ${s.priority}">
                <span class="suggestion-icon">${s.icon}</span>
                <div class="suggestion-content">
                    <h4>${s.title}</h4>
                    <p>${s.description}</p>
                    ${s.savings ? `<span class="suggestion-savings">Potential savings: ${formatCurrency(s.savings)}/month</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    generateReductionSuggestions() {
        const suggestions = [];
        const month = new Date().toISOString().substring(0, 7);
        const prevMonth = this.getPreviousMonth(month);
        const catTotals = this.store.getCategoryTotals(month);
        const prevCatTotals = this.store.getCategoryTotals(prevMonth);
        const monthTotal = Object.values(catTotals).reduce((a, b) => a + b, 0);

        // Check categories where spending increased
        Object.entries(catTotals).forEach(([cat, amount]) => {
            const prevAmount = prevCatTotals[cat] || 0;
            if (prevAmount > 0 && amount > prevAmount * 1.2) {
                const increase = amount - prevAmount;
                suggestions.push({
                    icon: '📈',
                    title: `${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat} spending increased by ${Math.round((increase / prevAmount) * 100)}%`,
                    description: `You spent ${formatCurrency(amount)} this month vs ${formatCurrency(prevAmount)} last month. Try to bring it back to last month's level.`,
                    savings: increase,
                    priority: increase > monthTotal * 0.1 ? 'high' : 'medium',
                });
            }
        });

        // Dining out reduction
        if (catTotals.dining > 0) {
            const pct = (catTotals.dining / monthTotal * 100).toFixed(0);
            if (pct > 10) {
                suggestions.push({
                    icon: '🍽️',
                    title: `Dining Out is ${pct}% of spending`,
                    description: `You've spent ${formatCurrency(catTotals.dining)} on dining out. Try reducing by cooking meals at home at least 3 days a week. Home meals cost 60-70% less.`,
                    savings: catTotals.dining * 0.4,
                    priority: pct > 20 ? 'high' : 'medium',
                });
            }
        }

        // Entertainment reduction
        if (catTotals.entertainment > 0 && catTotals.entertainment > monthTotal * 0.08) {
            suggestions.push({
                icon: '🎬',
                title: 'Entertainment spending is high',
                description: `${formatCurrency(catTotals.entertainment)} on entertainment. Look for free alternatives — parks, free events, home movie nights, library books.`,
                savings: catTotals.entertainment * 0.3,
                priority: 'medium',
            });
        }

        // Shopping
        if (catTotals.shopping > 0 && catTotals.shopping > monthTotal * 0.1) {
            suggestions.push({
                icon: '🛍️',
                title: 'Apply the 24-Hour Rule to Shopping',
                description: `You spent ${formatCurrency(catTotals.shopping)} on shopping. Wait 24 hours before any non-essential purchase to avoid impulse buying.`,
                savings: catTotals.shopping * 0.25,
                priority: 'medium',
            });
        }

        // Subscriptions
        if (catTotals.subscriptions > 0) {
            suggestions.push({
                icon: '📺',
                title: 'Audit Your Subscriptions',
                description: `${formatCurrency(catTotals.subscriptions)} goes to subscriptions. Review each one — do you actually use Netflix, Spotify, gym membership, etc.? Share family plans.`,
                savings: catTotals.subscriptions * 0.3,
                priority: 'low',
            });
        }

        // Transport + Fuel
        const transportTotal = (catTotals.transport || 0) + (catTotals.fuel || 0);
        if (transportTotal > monthTotal * 0.15) {
            suggestions.push({
                icon: '🚗',
                title: 'Transportation costs are significant',
                description: `${formatCurrency(transportTotal)} on transport & fuel. Try carpooling, public transport, or cycling for shorter distances.`,
                savings: transportTotal * 0.2,
                priority: 'medium',
            });
        }

        // Budget overages
        Object.entries(this.store.budgets).forEach(([cat, budget]) => {
            const spent = catTotals[cat] || 0;
            if (spent > budget) {
                suggestions.push({
                    icon: '⚠️',
                    title: `${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat} over budget!`,
                    description: `You've spent ${formatCurrency(spent)} against a budget of ${formatCurrency(budget)}. That's ${formatCurrency(spent - budget)} over budget.`,
                    savings: spent - budget,
                    priority: 'high',
                });
            }
        });

        // Credit card usage
        const creditExpenses = this.store.expenses
            .filter(e => e.date.substring(0, 7) === month && e.payment === 'credit');
        const creditTotal = creditExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
        if (creditTotal > monthTotal * 0.5) {
            suggestions.push({
                icon: '💳',
                title: 'High credit card usage',
                description: `${Math.round(creditTotal / monthTotal * 100)}% of expenses are on credit card. Be careful about interest charges. Try switching to debit/UPI for better spending awareness.`,
                priority: 'medium',
            });
        }

        return suggestions.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return (order[a.priority] || 2) - (order[b.priority] || 2);
        });
    }

    renderMonthInsights() {
        const container = document.getElementById('monthInsights');
        const month = new Date().toISOString().substring(0, 7);
        const prevMonth = this.getPreviousMonth(month);
        const catTotals = this.store.getCategoryTotals(month);
        const prevCatTotals = this.store.getCategoryTotals(prevMonth);
        const insights = [];

        Object.entries(catTotals).forEach(([cat, amount]) => {
            const prev = prevCatTotals[cat] || 0;
            if (prev > 0) {
                const change = ((amount - prev) / prev * 100).toFixed(0);
                if (Math.abs(change) > 5) {
                    const isUp = change > 0;
                    insights.push({
                        icon: isUp ? 'fa-arrow-up' : 'fa-arrow-down',
                        class: isUp ? 'insight-up' : 'insight-down',
                        text: `${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat}: ${isUp ? '+' : ''}${change}% (${formatCurrency(prev)} → ${formatCurrency(amount)})`,
                    });
                }
            } else if (amount > 0) {
                insights.push({
                    icon: 'fa-plus',
                    class: 'insight-neutral',
                    text: `${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat}: New category — ${formatCurrency(amount)}`,
                });
            }
        });

        // Categories reduced to zero
        Object.entries(prevCatTotals).forEach(([cat, amount]) => {
            if (!catTotals[cat] && amount > 0) {
                insights.push({
                    icon: 'fa-check',
                    class: 'insight-down',
                    text: `${CATEGORIES[cat]?.emoji || ''} ${CATEGORIES[cat]?.label || cat}: Eliminated! Saved ${formatCurrency(amount)} vs last month 🎉`,
                });
            }
        });

        if (insights.length === 0) {
            container.innerHTML = '<div class="insight-item"><i class="fas fa-info-circle insight-neutral"></i>Add expenses for at least two months to see month-over-month comparisons.</div>';
            return;
        }

        container.innerHTML = insights.map(i => `
            <div class="insight-item">
                <i class="fas ${i.icon} ${i.class}"></i>
                <span>${i.text}</span>
            </div>
        `).join('');
    }

    renderPersonalRecommendations() {
        const container = document.getElementById('personalRecs');
        const recs = this.generateRecommendations();

        container.innerHTML = recs.map(r => `
            <div class="rec-card">
                <div class="rec-header">
                    <i class="fas ${r.icon}"></i>
                    <h4>${r.title}</h4>
                </div>
                <p>${r.description}</p>
            </div>
        `).join('');
    }

    generateRecommendations() {
        const recs = [];
        const month = new Date().toISOString().substring(0, 7);
        const monthTotal = this.store.getTotalByPeriod('month');
        const income = this.store.income;
        const catTotals = this.store.getCategoryTotals(month);

        if (income > 0) {
            const savingsRate = ((income - monthTotal) / income * 100);
            if (savingsRate < 10) {
                recs.push({
                    icon: 'fa-exclamation-triangle',
                    title: 'Emergency: Low Savings Rate',
                    description: `Your savings rate is only ${savingsRate.toFixed(1)}%. Aim for at least 20%. Start by cutting your top discretionary expense by 30%.`,
                });
            } else if (savingsRate >= 10 && savingsRate < 20) {
                recs.push({
                    icon: 'fa-arrow-up',
                    title: 'Good Start — Increase Savings',
                    description: `You're saving ${savingsRate.toFixed(1)}%. Try the 50/30/20 rule to push it to 20%. Even an extra ₹${Math.round((income * 0.2 - (income - monthTotal)) / 30)}/day would help!`,
                });
            } else if (savingsRate >= 20) {
                recs.push({
                    icon: 'fa-star',
                    title: 'Great Savings Rate!',
                    description: `You're saving ${savingsRate.toFixed(1)}% — excellent! Consider investing the surplus: SIPs in index funds for long-term growth, or PPF for tax-free returns.`,
                });
            }

            // Investment allocation
            const potentialSavings = Math.max(0, income - monthTotal);
            if (potentialSavings > 0) {
                recs.push({
                    icon: 'fa-coins',
                    title: `Invest Your ₹${Math.round(potentialSavings).toLocaleString('en-IN')} Surplus`,
                    description: `Emergency Fund (3-6 months expenses): ₹${Math.round(potentialSavings * 0.3).toLocaleString('en-IN')}, SIP in Mutual Funds: ₹${Math.round(potentialSavings * 0.4).toLocaleString('en-IN')}, PPF/NPS: ₹${Math.round(potentialSavings * 0.3).toLocaleString('en-IN')}. Automate these on salary day!`,
                });
            }
        } else {
            recs.push({
                icon: 'fa-money-bill-wave',
                title: 'Set Your Monthly Income',
                description: 'Go to Budget & Savings and enter your monthly income. This enables savings tracking, budget planning, and personalized investment advice.',
            });
        }

        // Category-specific advice
        if (catTotals.food && catTotals.dining) {
            const foodRatio = catTotals.dining / (catTotals.food + catTotals.dining);
            if (foodRatio > 0.4) {
                recs.push({
                    icon: 'fa-utensils',
                    title: 'Shift Dining to Home Cooking',
                    description: `${Math.round(foodRatio * 100)}% of your food budget goes to dining out. Home cooking is 60-70% cheaper. Try meal prepping on weekends and carrying lunch to work.`,
                });
            }
        }

        // General recs
        recs.push({
            icon: 'fa-calendar-check',
            title: 'Weekly Review Habit',
            description: 'Every Sunday, spend 5 minutes reviewing your week\'s expenses. This small habit helps catch overspending early and keeps you mindful about money.',
        });

        if (!catTotals.insurance && income > 30000) {
            recs.push({
                icon: 'fa-shield-alt',
                title: 'Don\'t Forget Insurance',
                description: 'No insurance expenses recorded. Ensure you have health insurance (at least ₹5L cover) and term life insurance. These protect your financial future.',
            });
        }

        return recs;
    }

    // ===== EXPORT / IMPORT =====
    exportCSV() {
        const expenses = this.store.getExpenses({});
        if (expenses.length === 0) {
            this.showToast('No expenses to export!');
            return;
        }

        const headers = ['Date', 'Category', 'Amount', 'Payment', 'Note'];
        const rows = expenses.map(e => [
            e.date,
            CATEGORIES[e.category]?.label || e.category,
            e.amount,
            PAYMENT_LABELS[e.payment] || e.payment,
            `"${(e.note || '').replace(/"/g, '""')}"`,
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${getToday()}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Expenses exported successfully!');
    }

    importCSV(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const text = ev.target.result;
                const lines = text.split('\n').filter(l => l.trim());
                const header = lines[0].toLowerCase();

                // Skip header
                let imported = 0;
                for (let i = 1; i < lines.length; i++) {
                    const cols = lines[i].split(',');
                    if (cols.length >= 3) {
                        const date = cols[0].trim();
                        const catLabel = cols[1].trim();
                        const amount = parseFloat(cols[2]);

                        // Find category key by label
                        let catKey = 'misc';
                        Object.entries(CATEGORIES).forEach(([k, v]) => {
                            if (v.label.toLowerCase() === catLabel.toLowerCase()) catKey = k;
                        });

                        if (date && !isNaN(amount)) {
                            this.store.addExpense({
                                date,
                                category: catKey,
                                amount,
                                payment: 'cash',
                                note: cols.length > 4 ? cols.slice(4).join(',').replace(/"/g, '').trim() : '',
                            });
                            imported++;
                        }
                    }
                }

                this.showToast(`Imported ${imported} expenses!`);
                this.refreshAll();
            } catch (err) {
                this.showToast('Error importing CSV. Please check the format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    // ===== TOAST =====
    showToast(message) {
        const toast = document.getElementById('toast');
        document.getElementById('toastMessage').textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ===== INITIALIZE =====
const app = new ExpenseApp();
