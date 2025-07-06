// Global Variables
let currentUser = null;
let currentUserData = null;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    // Initialize particles
    initParticles();
    
    // Show loading screen
    showLoadingScreen();
    
    // Check if user is already logged in
    setTimeout(() => {
        checkExistingUser();
        hideLoadingScreen();
    }, 2000);
    
    // Setup event listeners
    setupEventListeners();
}

// Initialize Particle Background
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: {
                    value: 80,
                    density: {
                        enable: true,
                        value_area: 800
                    }
                },
                color: {
                    value: ["#00ff88", "#0080ff", "#ff0080"]
                },
                shape: {
                    type: "circle",
                    stroke: {
                        width: 0,
                        color: "#000000"
                    }
                },
                opacity: {
                    value: 0.5,
                    random: false,
                    anim: {
                        enable: false,
                        speed: 1,
                        opacity_min: 0.1,
                        sync: false
                    }
                },
                size: {
                    value: 3,
                    random: true,
                    anim: {
                        enable: false,
                        speed: 40,
                        size_min: 0.1,
                        sync: false
                    }
                },
                line_linked: {
                    enable: true,
                    distance: 150,
                    color: "#00ff88",
                    opacity: 0.4,
                    width: 1
                },
                move: {
                    enable: true,
                    speed: 6,
                    direction: "none",
                    random: false,
                    straight: false,
                    out_mode: "out",
                    bounce: false,
                    attract: {
                        enable: false,
                        rotateX: 600,
                        rotateY: 1200
                    }
                }
            },
            interactivity: {
                detect_on: "canvas",
                events: {
                    onhover: {
                        enable: true,
                        mode: "repulse"
                    },
                    onclick: {
                        enable: true,
                        mode: "push"
                    },
                    resize: true
                },
                modes: {
                    grab: {
                        distance: 400,
                        line_linked: {
                            opacity: 1
                        }
                    },
                    bubble: {
                        distance: 400,
                        size: 40,
                        duration: 2,
                        opacity: 8,
                        speed: 3
                    },
                    repulse: {
                        distance: 200,
                        duration: 0.4
                    },
                    push: {
                        particles_nb: 4
                    },
                    remove: {
                        particles_nb: 2
                    }
                }
            },
            retina_detect: true
        });
    }
}

// Loading Screen Functions
function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').classList.add('hidden');
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 800);
}

// Check if user is already logged in
function checkExistingUser() {
    const savedUser = localStorage.getItem('alvianzUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        loadUserData(currentUser.username);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Login Form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    
    // Register Form
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Show Register Modal
    document.getElementById('showRegister').addEventListener('click', showRegisterModal);
    
    // Close Modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleNavigation);
    });
    
    // Product Order Buttons
    document.querySelectorAll('.order-btn').forEach(btn => {
        btn.addEventListener('click', handleProductOrder);
    });
    
    // Deposit
    document.getElementById('depositAmount').addEventListener('input', updateCoinPreview);
    document.getElementById('confirmDeposit').addEventListener('click', handleDeposit);
    
    // Deposit Methods
    document.querySelectorAll('.deposit-method').forEach(method => {
        method.addEventListener('click', handleDepositMethod);
    });
    
    // Account Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Purchase Form
    document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseSubmit);
    
    // Profile Image Change
    document.getElementById('profileImageInput').addEventListener('change', handleProfileImageChange);
    
    // Modal Click Outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Handle Login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!username || !password) {
        showNotification('Mohon isi username dan password', 'error');
        return;
    }
    
    try {
        // Check if user exists in Firebase
        const userRef = database.ref('users/' + username);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.password === password) {
                // Login successful
                currentUser = { username, password };
                currentUserData = userData;
                
                // Save to localStorage
                localStorage.setItem('alvianzUser', JSON.stringify(currentUser));
                
                // Update last login and login streak
                await updateLoginStreak(username);
                
                // Show dashboard
                showDashboard();
                
                showNotification('Login berhasil! Selamat datang di Alvianz Store', 'success');
            } else {
                showNotification('Password salah!', 'error');
            }
        } else {
            showNotification('Username tidak ditemukan!', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Terjadi kesalahan saat login', 'error');
    }
}

// Handle Register
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    
    if (!username || !password || !fullName) {
        showNotification('Mohon isi semua field', 'error');
        return;
    }
    
    if (username.length < 3) {
        showNotification('Username minimal 3 karakter', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password minimal 6 karakter', 'error');
        return;
    }
    
    try {
        // Check if username already exists
        const userRef = database.ref('users/' + username);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            showNotification('Username sudah digunakan, silahkan pilih username lain', 'error');
            return;
        }
        
        // Create new user
        const newUser = {
            username: username,
            password: password,
            fullName: fullName,
            coins: 0,
            profileImage: 'https://via.placeholder.com/100',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            loginStreak: 1,
            totalLogins: 1,
            purchaseHistory: [],
            depositHistory: []
        };
        
        await userRef.set(newUser);
        
        showNotification('Registrasi berhasil! Silahkan login', 'success');
        closeModal();
        
    } catch (error) {
        console.error('Register error:', error);
        showNotification('Terjadi kesalahan saat registrasi', 'error');
    }
}

// Update Login Streak
async function updateLoginStreak(username) {
    try {
        const userRef = database.ref('users/' + username);
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        
        const now = new Date();
        const lastLogin = new Date(userData.lastLogin || now);
        const daysDiff = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));
        
        let newStreak = userData.loginStreak || 1;
        let bonusCoins = 0;
        
        if (daysDiff === 1) {
            // Consecutive day
            newStreak++;
            if (newStreak <= 7) {
                bonusCoins = 30;
            }
        } else if (daysDiff > 1) {
            // Reset streak
            newStreak = 1;
            bonusCoins = 30;
        }
        
        // Update user data
        const updates = {
            lastLogin: now.toISOString(),
            loginStreak: newStreak,
            totalLogins: (userData.totalLogins || 1) + 1
        };
        
        if (bonusCoins > 0) {
            updates.coins = (userData.coins || 0) + bonusCoins;
            showBonusNotification(newStreak, bonusCoins);
        }
        
        await userRef.update(updates);
        
        // Reload user data
        await loadUserData(username);
        
    } catch (error) {
        console.error('Error updating login streak:', error);
    }
}

// Load User Data
async function loadUserData(username) {
    try {
        const userRef = database.ref('users/' + username);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
            updateUI();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update UI with user data
function updateUI() {
    if (!currentUserData) return;
    
    // Update coins display
    document.getElementById('userCoins').textContent = currentUserData.coins || 0;
    document.getElementById('profileCoins').textContent = currentUserData.coins || 0;
    
    // Update user name
    document.getElementById('userName').textContent = currentUserData.fullName || currentUser.username;
    document.getElementById('profileName').textContent = currentUserData.fullName || currentUser.username;
    
    // Update profile image
    if (currentUserData.profileImage) {
        document.getElementById('userAvatar').src = currentUserData.profileImage;
        document.getElementById('profileImage').src = currentUserData.profileImage;
    }
    
    // Update login streak
    document.getElementById('loginStreak').textContent = currentUserData.loginStreak || 1;
    
    // Update history
    updatePurchaseHistory();
    updateDepositHistory();
}

// Show Dashboard
function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
}

// Show Bonus Notification
function showBonusNotification(day, coins) {
    const notification = document.getElementById('bonusNotification');
    document.getElementById('loginDay').textContent = day;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Handle Navigation
function handleNavigation(e) {
    const targetPage = e.currentTarget.dataset.page;
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Show target page
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(targetPage + 'Page').classList.add('active');
}

// Handle Product Order
function handleProductOrder(e) {
    e.stopPropagation();
    
    const productCard = e.currentTarget.closest('.product-card');
    const productName = productCard.dataset.product;
    const productPrice = parseInt(productCard.dataset.price);
    const productImage = productCard.dataset.image;
    
    // Check if user has enough coins
    if (!currentUserData || currentUserData.coins < productPrice) {
        showNotification('Coin tidak mencukupi! Silahkan top up terlebih dahulu.', 'error');
        return;
    }
    
    // Show order modal
    showOrderModal(productName, productPrice, productImage);
}

// Show Order Modal
function showOrderModal(productName, productPrice, productImage) {
    const modal = document.getElementById('orderModal');
    const loading = document.getElementById('orderLoading');
    const form = document.getElementById('orderForm');
    
    // Set product info
    document.getElementById('orderProductName').textContent = productName;
    document.getElementById('orderPrice').textContent = productPrice;
    
    // Store current order data
    window.currentOrder = {
        productName,
        productPrice,
        productImage
    };
    
    // Show loading first
    loading.style.display = 'block';
    form.style.display = 'none';
    modal.style.display = 'block';
    
    // Show form after loading
    setTimeout(() => {
        loading.style.display = 'none';
        form.style.display = 'block';
    }, 2000);
}

// Handle Purchase Submit
function handlePurchaseSubmit(e) {
    e.preventDefault();
    
    const formData = {
        accountName: document.getElementById('accountName').value,
        accountNumber: document.getElementById('accountNumber').value,
        requestDomain: document.getElementById('requestDomain').value,
        siteName: document.getElementById('siteName').value,
        adminUsername: document.getElementById('adminUsername').value,
        adminPassword: document.getElementById('adminPassword').value
    };
    
    // Validate form
    for (let key in formData) {
        if (!formData[key].trim()) {
            showNotification('Mohon isi semua field', 'error');
            return;
        }
    }
    
    // Process purchase
    processPurchase(formData);
}

// Process Purchase
async function processPurchase(formData) {
    try {
        const order = window.currentOrder;
        
        // Deduct coins
        const newCoins = currentUserData.coins - order.productPrice;
        
        // Create purchase record
        const purchase = {
            id: Date.now(),
            productName: order.productName,
            price: order.productPrice,
            formData: formData,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // Update user data
        const userRef = database.ref('users/' + currentUser.username);
        const updates = {
            coins: newCoins,
            purchaseHistory: [...(currentUserData.purchaseHistory || []), purchase]
        };
        
        await userRef.update(updates);
        
        // Add to admin panel for tracking
        await database.ref('purchases/' + purchase.id).set({
            ...purchase,
            username: currentUser.username,
            userFullName: currentUserData.fullName
        });
        
        // Update current user data
        currentUserData.coins = newCoins;
        currentUserData.purchaseHistory = updates.purchaseHistory;
        
        // Update UI
        updateUI();
        
        // Generate WhatsApp message
        const message = generateWhatsAppMessage(order.productName, formData);
        
        // Open WhatsApp
        const whatsappUrl = `https://wa.me/6283142313394?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Close modal
        closeModal();
        
        showNotification('Pesanan berhasil diproses! Anda akan diarahkan ke WhatsApp.', 'success');
        
    } catch (error) {
        console.error('Purchase error:', error);
        showNotification('Terjadi kesalahan saat memproses pesanan', 'error');
    }
}

// Generate WhatsApp Message
function generateWhatsAppMessage(productName, formData) {
    return `Halo Admin Alvianz, saya sudah melakukan pembelian produk *${productName}*.

Berikut data saya:
- Nama Rekening: ${formData.accountName}
- Nomor Rekening: ${formData.accountNumber}
- Request Domain: ${formData.requestDomain}
- Nama Situs: ${formData.siteName}
- Username Admin Panel: ${formData.adminUsername}
- Password Admin Panel: ${formData.adminPassword}

Mohon diproses segera. Terima kasih!`;
}

// Handle Deposit Method
function handleDepositMethod(e) {
    // Update active method
    document.querySelectorAll('.deposit-method').forEach(method => method.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Show corresponding payment method
    const method = e.currentTarget.dataset.method;
    document.querySelectorAll('.payment-method').forEach(pm => pm.classList.remove('active'));
    document.getElementById(method + 'Method').classList.add('active');
}

// Update Coin Preview
function updateCoinPreview() {
    const amount = parseInt(document.getElementById('depositAmount').value) || 0;
    const coins = Math.floor(amount / 1000);
    document.getElementById('coinPreview').textContent = coins;
}

// Handle Deposit
function handleDeposit() {
    const amount = parseInt(document.getElementById('depositAmount').value);
    
    if (!amount || amount < 10000) {
        showNotification('Minimum deposit Rp 10.000', 'error');
        return;
    }
    
    const coins = Math.floor(amount / 1000);
    
    // Generate WhatsApp message
    const message = `Halo Admin Alvianz, saya ingin melakukan deposit.

Username: ${currentUser.username}
Nama: ${currentUserData.fullName}
Jumlah Deposit: Rp ${amount.toLocaleString('id-ID')}
Coins yang didapat: ${coins}

Mohon konfirmasi setelah transfer. Terima kasih!`;
    
    // Save deposit request
    saveDepositRequest(amount, coins);
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/6283142313394?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    showNotification('Permintaan deposit dikirim! Anda akan diarahkan ke WhatsApp.', 'success');
}

// Save Deposit Request
async function saveDepositRequest(amount, coins) {
    try {
        const deposit = {
            id: Date.now(),
            username: currentUser.username,
            userFullName: currentUserData.fullName,
            amount: amount,
            coins: coins,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // Add to user's deposit history
        const userRef = database.ref('users/' + currentUser.username);
        const newDepositHistory = [...(currentUserData.depositHistory || []), deposit];
        
        await userRef.update({
            depositHistory: newDepositHistory
        });
        
        // Add to admin panel for approval
        await database.ref('deposits/' + deposit.id).set(deposit);
        
        // Update current user data
        currentUserData.depositHistory = newDepositHistory;
        updateDepositHistory();
        
    } catch (error) {
        console.error('Deposit save error:', error);
    }
}

// Handle Tab Switch
function handleTabSwitch(e) {
    const targetTab = e.currentTarget.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    e.currentTarget.classList.add('active');
    
    // Show target tab content
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
}

// Update Purchase History
function updatePurchaseHistory() {
    const container = document.getElementById('purchaseHistory');
    const history = currentUserData.purchaseHistory || [];
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <p>Belum ada pembelian</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.reverse().map(item => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="color: #00ff88;">${item.productName}</h4>
                <span style="color: #FFD700; font-weight: 600;">${item.price} Coins</span>
            </div>
            <p style="color: #888; font-size: 0.9rem;">Domain: ${item.formData.requestDomain}</p>
            <p style="color: #888; font-size: 0.8rem;">${new Date(item.date).toLocaleDateString('id-ID')}</p>
            <div style="margin-top: 0.5rem;">
                <span class="status-badge status-${item.status}">${item.status === 'pending' ? 'Menunggu' : item.status === 'completed' ? 'Selesai' : 'Dibatalkan'}</span>
            </div>
        </div>
    `).join('');
}

// Update Deposit History
function updateDepositHistory() {
    const container = document.getElementById('depositHistory');
    const history = currentUserData.depositHistory || [];
    
    if (history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-wallet"></i>
                <p>Belum ada deposit</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = history.reverse().map(item => `
        <div class="history-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <h4 style="color: #0080ff;">Deposit</h4>
                <span style="color: #FFD700; font-weight: 600;">+${item.coins} Coins</span>
            </div>
            <p style="color: #888; font-size: 0.9rem;">Jumlah: Rp ${item.amount.toLocaleString('id-ID')}</p>
            <p style="color: #888; font-size: 0.8rem;">${new Date(item.date).toLocaleDateString('id-ID')}</p>
            <div style="margin-top: 0.5rem;">
                <span class="status-badge status-${item.status}">${item.status === 'pending' ? 'Menunggu' : item.status === 'approved' ? 'Disetujui' : 'Ditolak'}</span>
            </div>
        </div>
    `).join('');
}

// Handle Profile Image Change
function handleProfileImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showNotification('Ukuran file maksimal 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const imageUrl = e.target.result;
        
        try {
            // Update in Firebase
            const userRef = database.ref('users/' + currentUser.username);
            await userRef.update({
                profileImage: imageUrl
            });
            
            // Update current user data
            currentUserData.profileImage = imageUrl;
            
            // Update UI
            document.getElementById('userAvatar').src = imageUrl;
            document.getElementById('profileImage').src = imageUrl;
            
            showNotification('Foto profil berhasil diperbarui', 'success');
            
        } catch (error) {
            console.error('Profile image update error:', error);
            showNotification('Gagal memperbarui foto profil', 'error');
        }
    };
    
    reader.readAsDataURL(file);
}

// Handle Logout
function handleLogout() {
    localStorage.removeItem('alvianzUser');
    currentUser = null;
    currentUserData = null;
    
    // Reset forms
    document.getElementById('loginForm').reset();
    
    // Show login page
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginPage').style.display = 'block';
    
    showNotification('Logout berhasil', 'success');
}

// Show Register Modal
function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'block';
}

// Close Modal
function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Reset forms
    document.getElementById('registerForm').reset();
    document.getElementById('purchaseForm').reset();
}

// Show Notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
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
        animation: slideInNotification 0.3s ease;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(20px);
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInNotification {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutNotification {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .status-badge {
        padding: 0.3rem 0.8rem;
        border-radius: 10px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .status-pending {
        background: linear-gradient(45deg, #FFA500, #FFD700);
        color: #000;
    }
    
    .status-completed,
    .status-approved {
        background: linear-gradient(45deg, #00ff88, #0080ff);
        color: #000;
    }
    
    .status-cancelled,
    .status-rejected {
        background: linear-gradient(45deg, #ff0080, #ff4080);
        color: #fff;
    }
`;
document.head.appendChild(style);