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