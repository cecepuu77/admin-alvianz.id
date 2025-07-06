// Global Variables
let isAdminLoggedIn = false;
let adminCoins = 99999999;
let currentStats = {
    totalUsers: 0,
    totalCoins: 0,
    totalSales: 0,
    totalRevenue: 0
};

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

// Initialize Admin Panel
function initializeAdminPanel() {
    showLoadingScreen();
    
    setTimeout(() => {
        hideLoadingScreen();
        checkAdminSession();
    }, 3000);
    
    setupEventListeners();
    updateAdminCoinsDisplay();
}

// Show/Hide Loading Screen
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 800);
}

// Check Admin Session
function checkAdminSession() {
    const savedAdmin = localStorage.getItem('alvianzAdmin');
    if (savedAdmin) {
        isAdminLoggedIn = true;
        showAdminDashboard();
        loadDashboardData();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Admin Login
    document.getElementById('adminLoginForm').addEventListener('submit', handleAdminLogin);
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });
    
    // Refresh buttons
    document.getElementById('refreshUsers').addEventListener('click', loadUsersData);
    document.getElementById('refreshDeposits').addEventListener('click', loadDepositsData);
    document.getElementById('refreshPurchases').addEventListener('click', loadPurchasesData);
    
    // Logout
    document.getElementById('adminLogout').addEventListener('click', handleAdminLogout);
    
    // Modal events
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Inject coins
    document.getElementById('confirmInject').addEventListener('click', confirmInjectCoins);
    
    // Modal click outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Handle Admin Login
async function handleAdminLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    
    // Check admin credentials
    if (email === 'Dewan@alvianz.id' && password === 'vianz666') {
        isAdminLoggedIn = true;
        localStorage.setItem('alvianzAdmin', JSON.stringify({ email, loginTime: new Date().toISOString() }));
        
        showAdminDashboard();
        loadDashboardData();
        
        showNotification('Galaxy Control Access Granted! Welcome Admin', 'success');
    } else {
        showNotification('Invalid Admin Credentials! Access Denied', 'error');
    }
}

// Show Admin Dashboard
function showAdminDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
}

// Handle Navigation
function handleNavigation(e) {
    const targetSection = e.currentTarget.dataset.section;
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Show target section
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    document.getElementById(targetSection + 'Section').classList.add('active');
    
    // Load section data
    switch(targetSection) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'deposits':
            loadDepositsData();
            break;
        case 'purchases':
            loadPurchasesData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Load users
        const usersSnapshot = await database.ref('users').once('value');
        const users = usersSnapshot.val() || {};
        
        // Load deposits
        const depositsSnapshot = await database.ref('deposits').once('value');
        const deposits = depositsSnapshot.val() || {};
        
        // Load purchases
        const purchasesSnapshot = await database.ref('purchases').once('value');
        const purchases = purchasesSnapshot.val() || {};
        
        // Calculate stats
        const totalUsers = Object.keys(users).length;
        const totalCoins = Object.values(users).reduce((sum, user) => sum + (user.coins || 0), 0);
        const totalSales = Object.keys(purchases).length;
        const totalRevenue = Object.values(purchases).reduce((sum, purchase) => sum + (purchase.price || 0), 0);
        
        // Update stats
        currentStats = { totalUsers, totalCoins, totalSales, totalRevenue };
        updateStatsDisplay();
        
        // Load recent activity
        loadRecentActivity(users, deposits, purchases);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Update Stats Display
function updateStatsDisplay() {
    document.getElementById('totalUsers').textContent = currentStats.totalUsers.toLocaleString();
    document.getElementById('totalCoins').textContent = currentStats.totalCoins.toLocaleString();
    document.getElementById('totalSales').textContent = currentStats.totalSales.toLocaleString();
    document.getElementById('totalRevenue').textContent = (currentStats.totalRevenue * 1000).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR'
    });
}

// Load Recent Activity
function loadRecentActivity(users, deposits, purchases) {
    const container = document.getElementById('recentActivity');
    const activities = [];
    
    // Add recent deposits
    Object.entries(deposits).forEach(([id, deposit]) => {
        activities.push({
            type: 'deposit',
            message: `${deposit.userFullName} requested deposit of ${deposit.coins} coins`,
            time: new Date(deposit.date),
            status: deposit.status
        });
    });
    
    // Add recent purchases
    Object.entries(purchases).forEach(([id, purchase]) => {
        activities.push({
            type: 'purchase',
            message: `${purchase.userFullName} purchased ${purchase.productName}`,
            time: new Date(purchase.date),
            status: purchase.status
        });
    });
    
    // Sort by time (newest first)
    activities.sort((a, b) => b.time - a.time);
    
    // Take only recent 10 activities
    const recentActivities = activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p>${activity.message}</p>
                <div>
                    <span class="status-badge status-${activity.status}">${activity.status}</span>
                    <small style="color: #888; margin-left: 1rem;">${activity.time.toLocaleString('id-ID')}</small>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Users Data
async function loadUsersData() {
    try {
        const snapshot = await database.ref('users').once('value');
        const users = snapshot.val() || {};
        
        const tbody = document.getElementById('usersTableBody');
        
        if (Object.keys(users).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #888;">No users found</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = Object.entries(users).map(([username, user]) => `
            <tr>
                <td>${username}</td>
                <td>${user.fullName || 'N/A'}</td>
                <td>
                    <span style="color: #FFD700; font-weight: 600;">
                        <i class="fas fa-coins"></i> ${user.coins || 0}
                    </span>
                </td>
                <td>
                    <span style="color: #ff0080;">
                        <i class="fas fa-fire"></i> ${user.loginStreak || 1}
                    </span>
                </td>
                <td>${user.totalLogins || 1}</td>
                <td>${new Date(user.lastLogin || user.createdAt).toLocaleDateString('id-ID')}</td>
                <td>
                    <button class="action-btn primary" onclick="showInjectCoinsModal('${username}')">
                        <i class="fas fa-coins"></i>
                        INJECT
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading users data:', error);
        showNotification('Error loading users data', 'error');
    }
}

// Load Deposits Data
async function loadDepositsData() {
    try {
        const snapshot = await database.ref('deposits').once('value');
        const deposits = snapshot.val() || {};
        
        const tbody = document.getElementById('depositsTableBody');
        
        if (Object.keys(deposits).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #888;">No deposits found</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = Object.entries(deposits).map(([id, deposit]) => `
            <tr>
                <td>${deposit.username}</td>
                <td>${deposit.userFullName}</td>
                <td>Rp ${deposit.amount.toLocaleString('id-ID')}</td>
                <td>
                    <span style="color: #FFD700; font-weight: 600;">
                        <i class="fas fa-coins"></i> ${deposit.coins}
                    </span>
                </td>
                <td>${new Date(deposit.date).toLocaleDateString('id-ID')}</td>
                <td>
                    <span class="status-badge status-${deposit.status}">${deposit.status}</span>
                </td>
                <td>
                    ${deposit.status === 'pending' ? `
                        <button class="action-btn primary" onclick="approveDeposit('${id}')">
                            <i class="fas fa-check"></i>
                            APPROVE
                        </button>
                        <button class="action-btn danger" onclick="rejectDeposit('${id}')">
                            <i class="fas fa-times"></i>
                            REJECT
                        </button>
                    ` : `
                        <span style="color: #888;">No Action</span>
                    `}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading deposits data:', error);
        showNotification('Error loading deposits data', 'error');
    }
}

// Load Purchases Data
async function loadPurchasesData() {
    try {
        const snapshot = await database.ref('purchases').once('value');
        const purchases = snapshot.val() || {};
        
        const tbody = document.getElementById('purchasesTableBody');
        
        if (Object.keys(purchases).length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #888;">No purchases found</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = Object.entries(purchases).map(([id, purchase]) => `
            <tr>
                <td>${purchase.username}</td>
                <td>${purchase.productName}</td>
                <td>
                    <span style="color: #FFD700; font-weight: 600;">
                        <i class="fas fa-coins"></i> ${purchase.price}
                    </span>
                </td>
                <td>${purchase.formData?.requestDomain || 'N/A'}</td>
                <td>${new Date(purchase.date).toLocaleDateString('id-ID')}</td>
                <td>
                    <span class="status-badge status-${purchase.status}">${purchase.status}</span>
                </td>
                <td>
                    ${purchase.status === 'pending' ? `
                        <button class="action-btn primary" onclick="completePurchase('${id}')">
                            <i class="fas fa-check"></i>
                            COMPLETE
                        </button>
                    ` : `
                        <span style="color: #888;">Completed</span>
                    `}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading purchases data:', error);
        showNotification('Error loading purchases data', 'error');
    }
}

// Load Analytics Data
async function loadAnalyticsData() {
    try {
        // Load all data for analytics
        const [usersSnapshot, depositsSnapshot, purchasesSnapshot] = await Promise.all([
            database.ref('users').once('value'),
            database.ref('deposits').once('value'),
            database.ref('purchases').once('value')
        ]);
        
        const users = usersSnapshot.val() || {};
        const deposits = depositsSnapshot.val() || {};
        const purchases = purchasesSnapshot.val() || {};
        
        // Product statistics
        loadProductStats(purchases);
        
        // User growth statistics
        loadGrowthStats(users);
        
        // Revenue statistics
        loadRevenueStats(deposits, purchases);
        
    } catch (error) {
        console.error('Error loading analytics data:', error);
        showNotification('Error loading analytics data', 'error');
    }
}

// Load Product Statistics
function loadProductStats(purchases) {
    const productCounts = {};
    
    Object.values(purchases).forEach(purchase => {
        const product = purchase.productName;
        productCounts[product] = (productCounts[product] || 0) + 1;
    });
    
    const sortedProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
    
    const container = document.getElementById('productStats');
    
    if (sortedProducts.length === 0) {
        container.innerHTML = '<p style="color: #888;">No product data available</p>';
        return;
    }
    
    container.innerHTML = sortedProducts.map(([product, count]) => `
        <div class="product-stat-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
            <span style="color: #00ff88; font-weight: 600;">${product}</span>
            <span style="color: #FFD700; font-weight: 600;">${count} sales</span>
        </div>
    `).join('');
}

// Load Growth Statistics
function loadGrowthStats(users) {
    const monthlyGrowth = {};
    
    Object.values(users).forEach(user => {
        const date = new Date(user.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyGrowth[monthKey] = (monthlyGrowth[monthKey] || 0) + 1;
    });
    
    const container = document.getElementById('growthStats');
    
    if (Object.keys(monthlyGrowth).length === 0) {
        container.innerHTML = '<p style="color: #888;">No growth data available</p>';
        return;
    }
    
    const sortedMonths = Object.entries(monthlyGrowth)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6);
    
    container.innerHTML = sortedMonths.map(([month, count]) => `
        <div class="growth-stat-item" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: rgba(0, 128, 255, 0.1); border-radius: 10px;">
            <span style="color: #0080ff; font-weight: 600;">${month}</span>
            <span style="color: #00ff88; font-weight: 600;">+${count} users</span>
        </div>
    `).join('');
}

// Load Revenue Statistics
function loadRevenueStats(deposits, purchases) {
    const totalDeposits = Object.values(deposits)
        .filter(d => d.status === 'approved')
        .reduce((sum, d) => sum + d.amount, 0);
    
    const totalRevenue = Object.values(purchases)
        .reduce((sum, p) => sum + (p.price * 1000), 0);
    
    const container = document.getElementById('revenueStats');
    
    container.innerHTML = `
        <div class="revenue-stat-item" style="margin-bottom: 1rem; padding: 1rem; background: rgba(255, 215, 0, 0.1); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #FFD700; font-weight: 600;">Total Deposits</span>
                <span style="color: #00ff88; font-weight: 600;">Rp ${totalDeposits.toLocaleString('id-ID')}</span>
            </div>
        </div>
        <div class="revenue-stat-item" style="margin-bottom: 1rem; padding: 1rem; background: rgba(255, 0, 128, 0.1); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #ff0080; font-weight: 600;">Total Revenue</span>
                <span style="color: #00ff88; font-weight: 600;">Rp ${totalRevenue.toLocaleString('id-ID')}</span>
            </div>
        </div>
        <div class="revenue-stat-item" style="padding: 1rem; background: rgba(0, 255, 136, 0.1); border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #00ff88; font-weight: 600;">Profit Margin</span>
                <span style="color: #FFD700; font-weight: 600;">${totalRevenue > 0 ? ((totalRevenue / (totalDeposits || 1)) * 100).toFixed(1) : 0}%</span>
            </div>
        </div>
    `;
}

// Show Inject Coins Modal
function showInjectCoinsModal(username) {
    document.getElementById('injectUsername').value = username;
    document.getElementById('injectAmount').value = '';
    document.getElementById('injectCoinsModal').style.display = 'block';
}

// Confirm Inject Coins
async function confirmInjectCoins() {
    const username = document.getElementById('injectUsername').value;
    const amount = parseInt(document.getElementById('injectAmount').value);
    
    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }
    
    if (amount > adminCoins) {
        showNotification('Insufficient admin coins', 'error');
        return;
    }
    
    try {
        // Get current user data
        const userRef = database.ref('users/' + username);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        if (!userData) {
            showNotification('User not found', 'error');
            return;
        }
        
        // Update user coins
        const newUserCoins = (userData.coins || 0) + amount;
        await userRef.update({ coins: newUserCoins });
        
        // Deduct admin coins
        adminCoins -= amount;
        updateAdminCoinsDisplay();
        
        // Save admin transaction log
        await database.ref('admin_transactions').push({
            type: 'coin_injection',
            adminId: 'AlvianzLX',
            targetUser: username,
            amount: amount,
            timestamp: new Date().toISOString()
        });
        
        closeModal();
        showNotification(`Successfully injected ${amount} coins to ${username}`, 'success');
        
        // Refresh users data
        loadUsersData();
        
    } catch (error) {
        console.error('Error injecting coins:', error);
        showNotification('Error injecting coins', 'error');
    }
}

// Approve Deposit
async function approveDeposit(depositId) {
    try {
        // Get deposit data
        const depositRef = database.ref('deposits/' + depositId);
        const snapshot = await depositRef.once('value');
        const depositData = snapshot.val();
        
        if (!depositData) {
            showNotification('Deposit not found', 'error');
            return;
        }
        
        // Check if admin has enough coins
        if (depositData.coins > adminCoins) {
            showNotification('Insufficient admin coins to approve this deposit', 'error');
            return;
        }
        
        // Update deposit status
        await depositRef.update({ status: 'approved' });
        
        // Add coins to user
        const userRef = database.ref('users/' + depositData.username);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        
        const newUserCoins = (userData.coins || 0) + depositData.coins;
        await userRef.update({ coins: newUserCoins });
        
        // Update user's deposit history
        const userDepositHistory = userData.depositHistory || [];
        const updatedHistory = userDepositHistory.map(item => 
            item.id === parseInt(depositId) ? { ...item, status: 'approved' } : item
        );
        await userRef.update({ depositHistory: updatedHistory });
        
        // Deduct admin coins
        adminCoins -= depositData.coins;
        updateAdminCoinsDisplay();
        
        // Save admin transaction log
        await database.ref('admin_transactions').push({
            type: 'deposit_approval',
            adminId: 'AlvianzLX',
            depositId: depositId,
            targetUser: depositData.username,
            amount: depositData.coins,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Deposit approved! ${depositData.coins} coins added to ${depositData.userFullName}`, 'success');
        
        // Refresh deposits data
        loadDepositsData();
        
    } catch (error) {
        console.error('Error approving deposit:', error);
        showNotification('Error approving deposit', 'error');
    }
}

// Reject Deposit
async function rejectDeposit(depositId) {
    try {
        // Get deposit data
        const depositRef = database.ref('deposits/' + depositId);
        const snapshot = await depositRef.once('value');
        const depositData = snapshot.val();
        
        if (!depositData) {
            showNotification('Deposit not found', 'error');
            return;
        }
        
        // Update deposit status
        await depositRef.update({ status: 'rejected' });
        
        // Update user's deposit history
        const userRef = database.ref('users/' + depositData.username);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        
        const userDepositHistory = userData.depositHistory || [];
        const updatedHistory = userDepositHistory.map(item => 
            item.id === parseInt(depositId) ? { ...item, status: 'rejected' } : item
        );
        await userRef.update({ depositHistory: updatedHistory });
        
        // Save admin transaction log
        await database.ref('admin_transactions').push({
            type: 'deposit_rejection',
            adminId: 'AlvianzLX',
            depositId: depositId,
            targetUser: depositData.username,
            amount: depositData.coins,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Deposit rejected for ${depositData.userFullName}`, 'success');
        
        // Refresh deposits data
        loadDepositsData();
        
    } catch (error) {
        console.error('Error rejecting deposit:', error);
        showNotification('Error rejecting deposit', 'error');
    }
}

// Complete Purchase
async function completePurchase(purchaseId) {
    try {
        // Update purchase status
        const purchaseRef = database.ref('purchases/' + purchaseId);
        await purchaseRef.update({ status: 'completed' });
        
        // Get purchase data to update user history
        const snapshot = await purchaseRef.once('value');
        const purchaseData = snapshot.val();
        
        // Update user's purchase history
        const userRef = database.ref('users/' + purchaseData.username);
        const userSnapshot = await userRef.once('value');
        const userData = userSnapshot.val();
        
        const userPurchaseHistory = userData.purchaseHistory || [];
        const updatedHistory = userPurchaseHistory.map(item => 
            item.id === parseInt(purchaseId) ? { ...item, status: 'completed' } : item
        );
        await userRef.update({ purchaseHistory: updatedHistory });
        
        // Save admin transaction log
        await database.ref('admin_transactions').push({
            type: 'purchase_completion',
            adminId: 'AlvianzLX',
            purchaseId: purchaseId,
            targetUser: purchaseData.username,
            product: purchaseData.productName,
            timestamp: new Date().toISOString()
        });
        
        showNotification(`Purchase completed for ${purchaseData.userFullName}`, 'success');
        
        // Refresh purchases data
        loadPurchasesData();
        
    } catch (error) {
        console.error('Error completing purchase:', error);
        showNotification('Error completing purchase', 'error');
    }
}

// Update Admin Coins Display
function updateAdminCoinsDisplay() {
    document.getElementById('adminCoins').textContent = adminCoins.toLocaleString();
}

// Handle Admin Logout
function handleAdminLogout() {
    localStorage.removeItem('alvianzAdmin');
    isAdminLoggedIn = false;
    
    // Reset forms
    document.getElementById('adminLoginForm').reset();
    
    // Show login page
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    
    showNotification('Galaxy Control Access Terminated', 'success');
}

// Close Modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset forms
    document.getElementById('injectAmount').value = '';
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles for galaxy theme
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(45deg, #00ff88, #0080ff)' : type === 'error' ? 'linear-gradient(45deg, #ff0080, #ff4080)' : 'linear-gradient(45deg, #0080ff, #00ff88)'};
        color: ${type === 'error' ? '#fff' : '#000'};
        padding: 1rem 1.5rem;
        border-radius: 15px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        z-index: 10000;
        animation: galaxySlideIn 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
        border: 2px solid rgba(255, 255, 255, 0.1);
        font-family: 'Orbitron', monospace;
        letter-spacing: 0.5px;
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'galaxySlideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add galaxy notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes galaxySlideIn {
        from {
            transform: translateX(100%) rotate(5deg);
            opacity: 0;
        }
        to {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
        }
    }
    
    @keyframes galaxySlideOut {
        from {
            transform: translateX(0) rotate(0deg);
            opacity: 1;
        }
        to {
            transform: translateX(100%) rotate(-5deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-refresh data every 30 seconds when admin is logged in
setInterval(() => {
    if (isAdminLoggedIn) {
        const activeSection = document.querySelector('.content-section.active').id;
        
        switch(activeSection) {
            case 'dashboardSection':
                loadDashboardData();
                break;
            case 'usersSection':
                loadUsersData();
                break;
            case 'depositsSection':
                loadDepositsData();
                break;
            case 'purchasesSection':
                loadPurchasesData();
                break;
            case 'analyticsSection':
                loadAnalyticsData();
                break;
        }
    }
}, 30000);

// Keyboard shortcuts for admin
document.addEventListener('keydown', function(e) {
    if (!isAdminLoggedIn) return;
    
    // Ctrl + R = Refresh current section
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        const activeSection = document.querySelector('.content-section.active').id;
        
        switch(activeSection) {
            case 'dashboardSection':
                loadDashboardData();
                break;
            case 'usersSection':
                loadUsersData();
                break;
            case 'depositsSection':
                loadDepositsData();
                break;
            case 'purchasesSection':
                loadPurchasesData();
                break;
            case 'analyticsSection':
                loadAnalyticsData();
                break;
        }
        
        showNotification('Data refreshed', 'success');
    }
    
    // Escape = Close modal
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Galaxy effects on hover for important elements
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to stat cards
    document.addEventListener('mouseover', function(e) {
        if (e.target.closest('.stat-card')) {
            const card = e.target.closest('.stat-card');
            card.style.background = 'linear-gradient(45deg, rgba(0, 255, 136, 0.1), rgba(0, 128, 255, 0.1))';
        }
        
        if (e.target.closest('.analytics-card')) {
            const card = e.target.closest('.analytics-card');
            card.style.background = 'linear-gradient(45deg, rgba(0, 255, 136, 0.05), rgba(255, 0, 128, 0.05))';
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.closest('.stat-card')) {
            const card = e.target.closest('.stat-card');
            card.style.background = 'rgba(0, 0, 0, 0.7)';
        }
        
        if (e.target.closest('.analytics-card')) {
            const card = e.target.closest('.analytics-card');
            card.style.background = 'rgba(0, 0, 0, 0.7)';
        }
    });
});