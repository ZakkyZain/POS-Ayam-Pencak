/* =========================================
   JS/DASHBOARD.JS - LOGIKA INTEGRASI DATA
   ========================================= */

function initDashboard() {
    // 1. Ambil data dari report hari ini & arsip (jika ingin total keseluruhan)
    const dailySales = JSON.parse(localStorage.getItem('sales_report')) || [];
    const archiveSales = DB.getArchive();
    
    // Gabungkan semua transaksi dari arsip + hari ini untuk statistik total
    let allTransactions = [...dailySales];
    Object.values(archiveSales).forEach(daySales => {
        allTransactions = allTransactions.concat(daySales);
    });

    // 2. Hitung Total Pendapatan & Transaksi
    const totalRevenue = allTransactions.reduce((sum, trx) => sum + trx.total, 0);
    const totalTrxCount = allTransactions.length;

    // 3. Hitung Menu Terlaris
    const menuStats = {};
    allTransactions.forEach(trx => {
        trx.items.forEach(item => {
            if (menuStats[item.name]) {
                menuStats[item.name] += item.qty;
            } else {
                menuStats[item.name] = item.qty;
            }
        });
    });

    // Ubah object ke array dan urutkan dari yang terbanyak
    const sortedMenu = Object.entries(menuStats)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);

    // 4. Update Tampilan HTML
    updateElement('totalRevenue', `Rp ${totalRevenue.toLocaleString()}`);
    updateElement('totalTransactions', `${totalTrxCount} Transaksi`);
    updateElement('totalCustomers', `${Math.floor(totalTrxCount * 0.8)} Orang`); // Estimasi pelanggan

    renderTopMenu(sortedMenu);
}

function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.innerText = value;
}

function renderTopMenu(menus) {
    const container = document.getElementById('topMenuContainer');
    if (!container) return;

    if (menus.length === 0) {
        container.innerHTML = `<p class="text-gray-400 text-xs italic">Belum ada data penjualan.</p>`;
        return;
    }

    // Ambil 3 besar saja
    container.innerHTML = menus.slice(0, 3).map((menu, index) => {
        // Ambil info produk dari DB untuk mendapatkan path gambar aslinya
        const products = DB.getProducts();
        const pInfo = products.find(p => p.name === menu.name);
        
        // Cek apakah pInfo.img adalah path file atau emoji
        const imageHtml = (pInfo && pInfo.img && pInfo.img.includes('/')) 
            ? `<img src="${pInfo.img}" class="w-full h-full object-cover rounded-lg">` 
            : `<span class="text-2xl">${pInfo ? pInfo.img : '🍽️'}</span>`;

        return `
            <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-2xl transition">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                        ${imageHtml}
                    </div>
                    <div>
                        <p class="font-bold text-sm text-gray-700">${menu.name}</p>
                        <p class="text-xs text-gray-400">${menu.qty} porsi terjual</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black ${index === 0 ? 'text-green-500' : 'text-gray-300'}">#${index + 1}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', initDailyDashboard);

function initDailyDashboard() {
    // Jalankan pengecekan harian dari DB dulu
    if (typeof DB !== 'undefined') {
        DB.initDailySession();
    }
    initDashboard();
}