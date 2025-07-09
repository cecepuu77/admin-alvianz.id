import { db, storage, auth } from "./firebase-config.js";
import {
    ref,
    get,
    set,
    update,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Global variables
let currentUser = null;
let products = [];
let filteredProducts = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Hide loading screen after 2 seconds
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }, 2000);

    // Initialize Firebase auth listener
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showUserInfo();
            loadUserData();
        } else {
            currentUser = null;
            showLoginButton();
        }
    });

    // Load products
    loadProducts();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
}

function initializeEventListeners() {
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = this.getAttribute('href');
            if (target.startsWith('#')) {
                scrollToSection(target.substring(1));
                updateActiveNav(this);
            }
        });
    });

    // Login/Register modals
    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const productModal = document.getElementById('productModal');

    loginBtn.addEventListener('click', () => openModal('loginModal'));
    
    // Close modals
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });

    // Modal switching
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('loginModal');
        openModal('registerModal');
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('registerModal');
        openModal('loginModal');
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('contactForm').addEventListener('submit', handleContactForm);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Product filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            filterProducts(filter);
            updateActiveFilter(this);
        });
    });

    // Window events
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    window.addEventListener('scroll', updateNavOnScroll);
}

function initializeSmoothScrolling() {
    // Add smooth scrolling behavior
    document.documentElement.style.scrollBehavior = 'smooth';
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    try {
        // Check if user exists in database
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists()) {
            showError('User not found');
            return;
        }

        const userData = snapshot.val();
        if (userData.password !== password) {
            showError('Invalid password');
            return;
        }

        // Store user info locally
        currentUser = { username, ...userData };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showUserInfo();
        closeModal('loginModal');
        showSuccess('Login successful!');
        
    } catch (error) {
        showError('Login failed: ' + error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirmPassword = document.getElementById('regConfirmPassword').value.trim();

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        // Check if username already exists
        const userRef = ref(db, `users/${username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            showError('Username already exists');
            return;
        }

        // Create user in database
        const userData = {
            username,
            email,
            password,
            coins: 0,
            createdAt: new Date().toISOString(),
            history: {}
        };

        await set(userRef, userData);
        
        // Auto login
        currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        showUserInfo();
        closeModal('registerModal');
        showSuccess('Registration successful!');
        
    } catch (error) {
        showError('Registration failed: ' + error.message);
    }
}

function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLoginButton();
    showSuccess('Logged out successfully!');
}

function showUserInfo() {
    document.getElementById('loginBtn').classList.add('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('userCoins').textContent = `💰 ${currentUser.coins || 0}`;
    }
}

function showLoginButton() {
    document.getElementById('loginBtn').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('hidden');
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userRef = ref(db, `users/${currentUser.username}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            currentUser = { ...currentUser, ...userData };
            document.getElementById('userCoins').textContent = `💰 ${userData.coins || 0}`;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Product functions
async function loadProducts() {
    try {
        const productsRef = ref(db, 'products');
        onValue(productsRef, (snapshot) => {
            const data = snapshot.val();
            products = data ? Object.entries(data).map(([id, product]) => ({ id, ...product })) : [];
            filteredProducts = [...products];
            displayProducts();
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = `
            <div class="no-products">
                <h3>🎲 No products found</h3>
                <p>Check back later for exciting new products!</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filteredProducts.map(product => `
        <div class="product-card" onclick="showProductModal('${product.id}')">
            <div class="product-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '🎮'}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">💰 ${product.price} Coins</div>
                <p class="product-description">${product.description || 'Premium digital product with instant delivery.'}</p>
                <div class="product-actions">
                    <button class="btn-primary btn-small" onclick="event.stopPropagation(); buyProduct('${product.id}')">
                        🛒 Buy Now
                    </button>
                    <button class="btn-secondary btn-small" onclick="event.stopPropagation(); showProductModal('${product.id}')">
                        👁️ Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterProducts(filter) {
    if (filter === 'all') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => 
            product.category && product.category.toLowerCase() === filter
        );
    }
    displayProducts();
}

function updateActiveFilter(activeBtn) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

async function showProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('productModal');
    const content = document.getElementById('productModalContent');
    
    content.innerHTML = `
        <div class="product-modal-header">
            <h2>${product.name}</h2>
            <div class="product-modal-price">💰 ${product.price} Coins</div>
        </div>
        <div class="product-modal-body">
            <div class="product-modal-image">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : '🎮'}
            </div>
            <div class="product-modal-details">
                <h3>📋 Product Details</h3>
                <p>${product.description || 'Premium digital product with instant delivery.'}</p>
                
                <div class="product-features">
                    <div class="feature-item">
                        <i class="fas fa-bolt"></i>
                        <span>Instant Delivery</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-shield-alt"></i>
                        <span>Secure Payment</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-headset"></i>
                        <span>24/7 Support</span>
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-primary" onclick="buyProduct('${product.id}')">
                        🛒 Buy Now for ${product.price} Coins
                    </button>
                </div>
            </div>
        </div>
    `;
    
    openModal('productModal');
}

async function buyProduct(productId) {
    if (!currentUser) {
        showError('Please login to make a purchase');
        openModal('loginModal');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) {
        showError('Product not found');
        return;
    }

    if (currentUser.coins < product.price) {
        showError('Insufficient coins. Please add more coins to your account.');
        return;
    }

    try {
        // Update user coins
        const newCoins = currentUser.coins - product.price;
        const userRef = ref(db, `users/${currentUser.username}`);
        await update(userRef, { coins: newCoins });

        // Add transaction to history
        const historyRef = push(ref(db, `users/${currentUser.username}/history`));
        await set(historyRef, {
            type: 'purchase',
            productId: product.id,
            productName: product.name,
            amount: product.price,
            timestamp: new Date().toLocaleString()
        });

        // Update local user data
        currentUser.coins = newCoins;
        document.getElementById('userCoins').textContent = `💰 ${newCoins}`;

        closeModal('productModal');
        showSuccess(`🎉 Successfully purchased ${product.name}!`);
        
        // Show delivery information
        setTimeout(() => {
            showDeliveryInfo(product);
        }, 1000);

    } catch (error) {
        showError('Purchase failed: ' + error.message);
    }
}

function showDeliveryInfo(product) {
    const deliveryModal = `
        <div id="deliveryModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close" onclick="closeModal('deliveryModal')">&times;</span>
                <div class="modal-header">
                    <h2>🚀 Instant Delivery</h2>
                </div>
                <div class="delivery-info">
                    <div class="delivery-success">
                        <i class="fas fa-check-circle"></i>
                        <h3>Purchase Successful!</h3>
                        <p>Your ${product.name} has been delivered instantly!</p>
                    </div>
                    <div class="delivery-instructions">
                        <h4>📋 Instructions:</h4>
                        <p>Please check your email or contact our support team for download links and activation details.</p>
                        <div class="contact-options">
                            <button class="btn-primary" onclick="window.open('https://wa.me/+6281234567890', '_blank')">
                                💬 WhatsApp Support
                            </button>
                            <button class="btn-secondary" onclick="closeModal('deliveryModal')">
                                ✅ Got it!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', deliveryModal);
}

// Contact form
async function handleContactForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name') || e.target.querySelector('input[type="text"]').value;
    const email = formData.get('email') || e.target.querySelector('input[type="email"]').value;
    const message = formData.get('message') || e.target.querySelector('textarea').value;

    try {
        const contactRef = push(ref(db, 'contacts'));
        await set(contactRef, {
            name,
            email,
            message,
            timestamp: new Date().toISOString()
        });

        e.target.reset();
        showSuccess('Message sent successfully! We\'ll get back to you soon.');
    } catch (error) {
        showError('Failed to send message: ' + error.message);
    }
}

// Utility functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Remove dynamically created modals
        if (modalId === 'deliveryModal') {
            modal.remove();
        }
    }
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        const offset = 80; // Account for fixed navbar
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    }
}

function updateActiveNav(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

function updateNavOnScroll() {
    const sections = ['home', 'products', 'about', 'contact'];
    const scrollPosition = window.scrollY + 100;

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        const navLink = document.querySelector(`a[href="#${sectionId}"]`);
        
        if (section && navLink) {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                navLink.classList.add('active');
            }
        }
    });
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Global functions for HTML onclick events
window.scrollToProducts = function() {
    scrollToSection('products');
};

window.buyProduct = buyProduct;
window.showProductModal = showProductModal;
window.openModal = openModal;
window.closeModal = closeModal;

// Load user from localStorage on page load
window.addEventListener('load', () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showUserInfo();
        loadUserData();
    }
});

// Add notification styles
const notificationStyles = `
<style>
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 15px 20px;
    border-radius: 10px;
    color: white;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    max-width: 400px;
}

.notification.success {
    background: linear-gradient(45deg, #28a745, #20c997);
    border: 1px solid #28a745;
}

.notification.error {
    background: linear-gradient(45deg, #dc3545, #e74c3c);
    border: 1px solid #dc3545;
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.notification button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes slideIn {
    0% { transform: translateX(100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
}

.no-products {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: #ccc;
}

.no-products h3 {
    color: #ffd700;
    margin-bottom: 15px;
    font-family: 'Cinzel', serif;
}

.delivery-info {
    text-align: center;
}

.delivery-success {
    margin-bottom: 30px;
}

.delivery-success i {
    font-size: 60px;
    color: #28a745;
    margin-bottom: 20px;
}

.delivery-success h3 {
    color: #ffd700;
    margin-bottom: 10px;
}

.delivery-instructions {
    background: rgba(255, 255, 255, 0.05);
    padding: 20px;
    border-radius: 10px;
    margin-top: 20px;
}

.delivery-instructions h4 {
    color: #ffd700;
    margin-bottom: 15px;
}

.contact-options {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 20px;
}

.product-modal-header {
    text-align: center;
    margin-bottom: 30px;
}

.product-modal-price {
    font-size: 1.5rem;
    color: #ffd700;
    font-weight: 700;
    margin-top: 10px;
}

.product-modal-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    align-items: start;
}

.product-modal-image {
    text-align: center;
}

.product-modal-image img {
    width: 100%;
    max-width: 200px;
    border-radius: 10px;
}

.product-features {
    margin: 20px 0;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    color: #ffd700;
}

@media (max-width: 768px) {
    .product-modal-body {
        grid-template-columns: 1fr;
    }
    
    .contact-options {
        flex-direction: column;
    }
    
    .notification {
        right: 10px;
        left: 10px;
        max-width: none;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', notificationStyles);