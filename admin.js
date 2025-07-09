import { db, storage, auth } from "./firebase-config.js";
import {
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  push
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  ref as sRef,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import {
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Login Admin
window.loginAdmin = function () {
  const email = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value.trim();
  const error = document.getElementById("loginError");

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      const loginBox = document.getElementById("loginBox");
      loginBox.classList.add("fade-out");

      setTimeout(() => {
        document.getElementById("loginPage").classList.add("hidden");
        const dash = document.getElementById("adminDashboard");
        dash.classList.remove("hidden");
        dash.style.opacity = 1;
        showTab("dashboard");
        loadStats();
        loadProducts();
        loadHistory();
        loadLog();
        loadDeposits();
        initializeMessageSystem();
      }, 1000);
    })
    .catch((err) => {
      error.textContent = "Login gagal: " + err.message;
    });
};

// Logout
window.logoutAdmin = function () {
  signOut(auth).then(() => location.reload());
};

// Navigasi tab
window.showTab = function (tab) {
  document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
  document.getElementById(`tab-${tab}`).classList.remove("hidden");
};

// Statistik Dashboard
window.loadStats = function () {
  get(ref(db, "admin/coins")).then(snap => {
    const coins = snap.exists() ? snap.val() : 99999999;
    document.getElementById("adminCoins").textContent = "💰 " + coins.toLocaleString();
    if (!snap.exists()) set(ref(db, "admin/coins"), 99999999);
  });

  get(ref(db, "users")).then(snap => {
    let total = 0;
    const users = snap.val() || {};
    Object.values(users).forEach(u => total += u.coins || 0);
    document.getElementById("userCoins").textContent = "👥 " + total.toLocaleString();
  });

  get(ref(db, "users")).then(snap => {
    let latest = { time: 0, user: "", amount: 0 };
    Object.entries(snap.val() || {}).forEach(([username, user]) => {
      if (user.history) {
        Object.values(user.history).forEach(trx => {
          const t = new Date(trx.timestamp).getTime();
          if (trx.type === "buy" && t > latest.time) {
            latest = { time: t, user: username, amount: trx.amount };
          }
        });
      }
    });
    document.getElementById("lastPurchase").textContent =
      latest.time ? `${latest.user} - ${latest.amount} coin` : "-";
  });
};

// Inject Coin
window.injectCoin = function (e) {
  e.preventDefault();
  const username = document.getElementById("injectUser").value.trim();
  const amount = parseInt(document.getElementById("injectAmount").value);
  const status = document.getElementById("injectStatus");

  if (!username || !amount) {
    status.textContent = "Isi semua kolom.";
    return;
  }

  const userRef = ref(db, `users/${username}`);
  get(userRef).then(snapshot => {
    if (!snapshot.exists()) {
      status.textContent = "User tidak ditemukan.";
      return;
    }

    const userData = snapshot.val();
    const newCoins = (userData.coins || 0) + amount;

    update(userRef, { coins: newCoins });

    const historyRef = ref(db, `users/${username}/history`);
    const newHistory = push(historyRef);
    set(newHistory, {
      type: "inject",
      amount: amount,
      timestamp: new Date().toLocaleString()
    });

    get(ref(db, "admin/coins")).then(snap => {
      const adminCoins = snap.val() || 99999999;
      update(ref(db, "admin"), { coins: adminCoins - amount });
      loadStats();
    });

    status.textContent = `✅ ${amount} coin berhasil dikirim ke ${username}`;
    logAktivitas("Inject Coin", `${username} +${amount}`);
  });
};

// Log Aktivitas
function logAktivitas(aksi, detail = "") {
  const logRef = push(ref(db, "adminLogs"));
  const logData = {
    email: auth.currentUser?.email || "unknown",
    aksi,
    detail,
    waktu: new Date().toLocaleString()
  };
  set(logRef, logData);
}

// Load Produk
window.loadProducts = function () {
  const productRef = ref(db, "products");
  onValue(productRef, (snapshot) => {
    const data = snapshot.val() || {};
    const list = document.getElementById("productList");
    let html = "";

    Object.entries(data).forEach(([key, item]) => {
      html += `
        <div style="margin-bottom:20px;">
          <p><strong>${item.name}</strong> - ${item.price} coin</p>
          ${item.image ? `<img src="${item.image}" style="width:100px;border-radius:6px;" />` : ""}
          <br />
          <button onclick="editProduct('${key}')">✏️ Edit</button>
          <button onclick="deleteProduct('${key}')">🗑️ Hapus</button>
          <hr />
        </div>
      `;
    });

    list.innerHTML = html || "<p>Belum ada produk.</p>";
  });
};

// Tambah/Edit Produk
document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseInt(document.getElementById("productPrice").value);
  const file = document.getElementById("productFile").files[0];
  const editingId = this.getAttribute("data-editing-id");

  if (!name || !price) {
    alert("Nama dan harga wajib diisi.");
    return;
  }

  let imageUrl = "";
  if (file) {
    const filePath = `produk/${Date.now()}_${file.name}`;
    const fileRef = sRef(storage, filePath);
    await uploadBytes(fileRef, file);
    imageUrl = await getDownloadURL(fileRef);
  }

  const productData = { name, price };
  if (imageUrl) productData.image = imageUrl;

  if (editingId) {
    update(ref(db, `products/${editingId}`), productData);
    alert("Produk berhasil diperbarui.");
    logAktivitas("Edit Produk", name);
    this.removeAttribute("data-editing-id");
  } else {
    const productRef = push(ref(db, "products"));
    productData.image = imageUrl;
    productData.createdAt = new Date().toISOString();
    set(productRef, productData);
    alert("Produk berhasil ditambahkan.");
    logAktivitas("Tambah Produk", name);
  }

  this.reset();
});

// Edit Produk
window.editProduct = function (productId) {
  const productRef = ref(db, `products/${productId}`);
  get(productRef).then((snapshot) => {
    const data = snapshot.val();
    if (!data) return alert("Produk tidak ditemukan.");
    document.getElementById("productName").value = data.name;
    document.getElementById("productPrice").value = data.price;
    document.getElementById("productForm").setAttribute("data-editing-id", productId);
    alert("Silakan edit data di form, lalu klik Simpan Produk.");
  });
};

// Hapus Produk
window.deleteProduct = function (productId) {
  if (confirm("Yakin ingin menghapus produk ini?")) {
    const productRef = ref(db, `products/${productId}`);
    get(productRef).then((snap) => {
      const data = snap.val();
      remove(productRef)
        .then(() => {
          alert("Produk berhasil dihapus.");
          logAktivitas("Hapus Produk", data?.name || productId);
        })
        .catch(err => alert("Gagal menghapus produk: " + err.message));
    });
  }
};

// Riwayat Transaksi
window.loadHistory = function () {
  const container = document.getElementById("transactionHistory");
const usersRef = ref(db, "users");

  get(usersRef).then((snapshot) => {
    const users = snapshot.val();
    if (!users) {
      container.innerHTML = "<p>Belum ada transaksi.</p>";
      return;
    }

    let html = `<table><thead><tr><th>Nama</th><th>Jenis</th><th>Nominal</th><th>Waktu</th></tr></thead><tbody>`;
    Object.entries(users).forEach(([username, user]) => {
      if (user.history) {
        Object.values(user.history).forEach((trx) => {
          html += `
            <tr>
              <td>${username}</td>
              <td>${trx.type}</td>
              <td>${trx.amount}</td>
              <td>${trx.timestamp}</td>
            </tr>
          `;
        });
      }
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  });
};

// Log Admin
window.loadLog = function () {
  const container = document.getElementById("logContainer");
  const logRef = ref(db, "adminLogs");

  onValue(logRef, (snapshot) => {
    const logs = snapshot.val();
    if (!logs) {
      container.innerHTML = "<p>Belum ada log aktivitas.</p>";
      return;
    }

    let html = "<ul>";
    Object.values(logs).reverse().forEach(log => {
      html += `<li><strong>${log.email}</strong> - ${log.aksi} ${log.detail ? `(${log.detail})` : ""} <br><small>${log.waktu}</small></li>`;
    });
    html += "</ul>";
    container.innerHTML = html;
  });
};

// Deteksi & ACC Deposit
window.loadDeposits = function () {
  const container = document.getElementById("depositRequests");
  const depositRef = ref(db, "deposits");

  onValue(depositRef, (snapshot) => {
    const deposits = snapshot.val();
    if (!deposits) {
      container.innerHTML = "<p>Tidak ada permintaan deposit.</p>";
      return;
    }

    let html = "<ul>";
    Object.entries(deposits).forEach(([id, dep]) => {
      if (dep.status === "pending") {
        html += `
          <li>
            <strong>${dep.username}</strong> - 💳 ${dep.amount} coin
            <br><small>${dep.timestamp}</small><br>
            <button onclick="accDeposit('${id}', '${dep.username}', ${dep.amount})">✅ ACC</button>
          </li>
        `;
      }
    });
    html += "</ul>";
    container.innerHTML = html || "<p>Tidak ada deposit pending.</p>";
  });
};

window.accDeposit = function (id, username, amount) {
  const userRef = ref(db, `users/${username}`);
  get(userRef).then((snap) => {
    if (!snap.exists()) return alert("User tidak ditemukan.");

    const user = snap.val();
    const newCoins = (user.coins || 0) + amount;

    update(userRef, { coins: newCoins });

    const historyRef = push(ref(db, `users/${username}/history`));
    set(historyRef, {
      type: "deposit",
      amount,
      timestamp: new Date().toLocaleString()
    });

    update(ref(db, `deposits/${id}`), { status: "done" });

    logAktivitas("ACC Deposit", `${username} +${amount}`);
    alert(`✅ Deposit ${amount} coin berhasil di-ACC untuk ${username}`);
    loadStats();
  });
};

// ========== SISTEM PESAN ==========

// Initialize message system
window.initializeMessageSystem = function() {
  setupCharCounters();
  loadSentMessages();
};

// Setup character counters for textareas
function setupCharCounters() {
  const messageContent = document.getElementById("messageContent");
  const charCount = document.getElementById("charCount");
  const broadcastContent = document.getElementById("broadcastContent");
  const broadcastCharCount = document.getElementById("broadcastCharCount");

  if (messageContent && charCount) {
    messageContent.addEventListener("input", function() {
      const count = this.value.length;
      charCount.textContent = count;
      charCount.style.color = count > 1800 ? "#e74c3c" : "#666";
    });
  }

  if (broadcastContent && broadcastCharCount) {
    broadcastContent.addEventListener("input", function() {
      const count = this.value.length;
      broadcastCharCount.textContent = count;
      broadcastCharCount.style.color = count > 1800 ? "#e74c3c" : "#666";
    });
  }
}

// Send message to specific user
window.sendMessage = function(event) {
  event.preventDefault();
  
  const recipient = document.getElementById("messageRecipient").value.trim();
  const subject = document.getElementById("messageSubject").value.trim();
  const content = document.getElementById("messageContent").value.trim();
  const status = document.getElementById("messageStatus");

  if (!recipient || !subject || !content) {
    status.textContent = "❌ Semua field harus diisi.";
    status.style.color = "#e74c3c";
    return;
  }

  if (content.length > 2000) {
    status.textContent = "❌ Pesan terlalu panjang. Maksimal 2000 karakter.";
    status.style.color = "#e74c3c";
    return;
  }

  // Check if user exists
  const userRef = ref(db, `users/${recipient}`);
  get(userRef).then(snapshot => {
    if (!snapshot.exists()) {
      status.textContent = "❌ User tidak ditemukan.";
      status.style.color = "#e74c3c";
      return;
    }

    // Split message if too long (implement chunking for very long messages)
    const messageChunks = splitMessage(content, 1500); // Split into smaller chunks
    
    // Send each chunk
    const promises = messageChunks.map((chunk, index) => {
      const messageData = {
        from: "admin",
        to: recipient,
        subject: messageChunks.length > 1 ? `${subject} (${index + 1}/${messageChunks.length})` : subject,
        content: chunk,
        timestamp: new Date().toISOString(),
        read: false,
        type: "direct"
      };

      // Save to recipient's inbox
      const inboxRef = push(ref(db, `users/${recipient}/messages`));
      return set(inboxRef, messageData);
    });

    // Save to sent messages
    const sentMessageData = {
      to: recipient,
      subject: subject,
      content: content,
      timestamp: new Date().toISOString(),
      chunks: messageChunks.length,
      type: "direct"
    };
    const sentRef = push(ref(db, "admin/sentMessages"));
    
    Promise.all([...promises, set(sentRef, sentMessageData)])
      .then(() => {
        status.textContent = `✅ Pesan berhasil dikirim ke ${recipient}`;
        if (messageChunks.length > 1) {
          status.textContent += ` dalam ${messageChunks.length} bagian`;
        }
        status.style.color = "#27ae60";
        
        // Reset form
        document.getElementById("messageForm").reset();
        document.getElementById("charCount").textContent = "0";
        
        // Log activity
        logAktivitas("Kirim Pesan", `ke ${recipient}: ${subject}`);
        
        // Reload sent messages
        loadSentMessages();
      })
      .catch(error => {
        status.textContent = "❌ Gagal mengirim pesan: " + error.message;
        status.style.color = "#e74c3c";
      });
  });
};

// Send broadcast to all users
window.sendBroadcast = function(event) {
  event.preventDefault();
  
  const subject = document.getElementById("broadcastSubject").value.trim();
  const content = document.getElementById("broadcastContent").value.trim();
  const status = document.getElementById("broadcastStatus");

  if (!subject || !content) {
    status.textContent = "❌ Semua field harus diisi.";
    status.style.color = "#e74c3c";
    return;
  }

  if (content.length > 2000) {
    status.textContent = "❌ Pesan terlalu panjang. Maksimal 2000 karakter.";
    status.style.color = "#e74c3c";
    return;
  }

  // Get all users
  const usersRef = ref(db, "users");
  get(usersRef).then(snapshot => {
    const users = snapshot.val();
    if (!users) {
      status.textContent = "❌ Tidak ada user yang ditemukan.";
      status.style.color = "#e74c3c";
      return;
    }

    const usernames = Object.keys(users);
    const messageChunks = splitMessage(content, 1500);
    
    // Send to all users
    const promises = [];
    
    usernames.forEach(username => {
      messageChunks.forEach((chunk, index) => {
        const messageData = {
          from: "admin",
          to: username,
          subject: messageChunks.length > 1 ? `[BROADCAST] ${subject} (${index + 1}/${messageChunks.length})` : `[BROADCAST] ${subject}`,
          content: chunk,
          timestamp: new Date().toISOString(),
          read: false,
          type: "broadcast"
        };

        const inboxRef = push(ref(db, `users/${username}/messages`));
        promises.push(set(inboxRef, messageData));
      });
    });

    // Save to sent messages
    const sentBroadcastData = {
      to: "ALL_USERS",
      subject: subject,
      content: content,
      timestamp: new Date().toISOString(),
      recipients: usernames.length,
      chunks: messageChunks.length,
      type: "broadcast"
    };
    const sentRef = push(ref(db, "admin/sentMessages"));
    promises.push(set(sentRef, sentBroadcastData));

    Promise.all(promises)
      .then(() => {
        status.textContent = `✅ Broadcast berhasil dikirim ke ${usernames.length} user`;
        if (messageChunks.length > 1) {
          status.textContent += ` dalam ${messageChunks.length} bagian`;
        }
        status.style.color = "#27ae60";
        
        // Reset form
        document.getElementById("broadcastForm").reset();
        document.getElementById("broadcastCharCount").textContent = "0";
        
        // Log activity
        logAktivitas("Broadcast", `ke ${usernames.length} user: ${subject}`);
        
        // Reload sent messages
        loadSentMessages();
      })
      .catch(error => {
        status.textContent = "❌ Gagal mengirim broadcast: " + error.message;
        status.style.color = "#e74c3c";
      });
  });
};

// Split long messages into chunks
function splitMessage(message, maxLength) {
  if (message.length <= maxLength) {
    return [message];
  }

  const chunks = [];
  let currentPos = 0;

  while (currentPos < message.length) {
    let chunkEnd = currentPos + maxLength;
    
    // If not at the end, try to break at a word boundary
    if (chunkEnd < message.length) {
      const lastSpace = message.lastIndexOf(' ', chunkEnd);
      const lastNewline = message.lastIndexOf('\n', chunkEnd);
      const breakPoint = Math.max(lastSpace, lastNewline);
      
      if (breakPoint > currentPos) {
        chunkEnd = breakPoint;
      }
    }
    
    chunks.push(message.substring(currentPos, chunkEnd).trim());
    currentPos = chunkEnd + 1;
  }

  return chunks.filter(chunk => chunk.length > 0);
}

// Load sent messages history
window.loadSentMessages = function() {
  const container = document.getElementById("sentMessages");
  const sentRef = ref(db, "admin/sentMessages");

  onValue(sentRef, (snapshot) => {
    const messages = snapshot.val();
    if (!messages) {
      container.innerHTML = "<p>Belum ada pesan yang dikirim.</p>";
      return;
    }

    let html = `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; border: 1px solid #ddd;">Penerima</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Subjek</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Tipe</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Waktu</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Sort messages by timestamp (newest first)
    const sortedMessages = Object.entries(messages).sort((a, b) => 
      new Date(b[1].timestamp) - new Date(a[1].timestamp)
    );

    sortedMessages.forEach(([id, msg]) => {
      const isBroadcast = msg.type === "broadcast";
      const recipientText = isBroadcast ? `${msg.recipients} users` : msg.to;
      const typeText = isBroadcast ? "Broadcast" : "Direct";
      const statusText = msg.chunks > 1 ? `${msg.chunks} bagian` : "1 bagian";
      
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${recipientText}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${msg.subject}</td>
          <td style="padding: 8px; border: 1px solid #ddd;"><span style="background: ${isBroadcast ? '#e74c3c' : '#3498db'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px;">${typeText}</span></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${new Date(msg.timestamp).toLocaleString()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${statusText}</td>
        </tr>
      `;
    });

    html += "</tbody></table>";
    container.innerHTML = html;
  });
};