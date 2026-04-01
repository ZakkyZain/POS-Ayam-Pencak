/* =========================================
   1. DATA CENTRAL
   ========================================= */

// DATA AWAL (Hanya muncul jika localStorage kosong sama sekali)
const initialIngredients = [
    { id: 'i1', name: 'Potongan Ayam', stock: 50, unit: 'pcs' },
    { id: 'i2', name: 'Nasi Putih', stock: 5000, unit: 'gram' },
    { id: 'i3', name: 'Cabe Rawit', stock: 100, unit: 'biji' },
    { id: 'i4', name: 'Minyak Goreng', stock: 1000, unit: 'ml' }
];

// LOAD DATA: Ambil dari localStorage atau gunakan data awal
let ingredients = JSON.parse(localStorage.getItem('inventory_data')) || initialIngredients;

// SIMPAN PERTAMA KALI: Jika localStorage kosong, isi dengan data awal
if (!localStorage.getItem('inventory_data')) {
    localStorage.setItem('inventory_data', JSON.stringify(initialIngredients));
}

const defaultProducts = [
    { id: 'p1', name: 'Ayam Geprek', price: 15000, img: '🍗', recipe: [{ id: 'i1', qty: 1 }, { id: 'i2', qty: 100 }, { id: 'i3', qty: 5 }] },
    { id: 'p2', name: 'Paket Hemat', price: 25000, img: '🍱', recipe: [{ id: 'i1', qty: 2 }, { id: 'i2', qty: 150 }] },
    { id: 'p3', name: 'Es Teh Manis', price: 5000, img: '🥤', recipe: [] }
];

let products = JSON.parse(localStorage.getItem('products_data')) || defaultProducts;
let cart = [];

/* =========================================
   2. OTOMATISASI & RENDER
   ========================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Render Menu & Cart (Kasir)
    if (document.getElementById('menuList')) {
        renderMenu();
        renderCart();
    }
    
    // Render Tabel Stok (Halaman Stok)
    // Cek ID 'inventoryTable' atau 'inventoryTableBody'
    if (document.getElementById('inventoryTable') || document.getElementById('inventoryTableBody')) {
        renderInventory();
    }
});

function renderMenu() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;
    menuList.innerHTML = products.map(p => `
        <div onclick="addToCart('${p.id}')" class="bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-green-500 transition cursor-pointer text-center group">
            <div class="text-4xl mb-3 group-hover:scale-110 transition-transform">
                ${p.img.length > 10 ? `<img src="${p.img}" class="w-12 h-12 mx-auto object-cover rounded-lg">` : p.img}
            </div>
            <h3 class="font-bold text-gray-700 text-sm mb-1">${p.name}</h3>
            <p class="text-green-500 font-bold text-xs">Rp ${p.price.toLocaleString()}</p>
        </div>
    `).join('');
}

/* =========================================
   3. LOGIKA KASIR
   ========================================= */
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        cart.push({...product});
        renderCart();
    }
}

function renderCart() {
    const cartDiv = document.getElementById('cartItems');
    if (!cartDiv) return;
    
    let total = 0;
    cartDiv.innerHTML = cart.map((item, index) => {
        total += item.price;
        return `
            <div class="flex justify-between items-center mb-2 animate-fade-in border-b border-gray-50 pb-2">
                <span class="text-sm font-bold text-gray-700">1x ${item.name}</span>
                <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-gray-600">Rp ${item.price.toLocaleString()}</span>
                    <button onclick="removeFromCart(${index})" class="text-red-400 hover:text-red-600"><i class="fas fa-times-circle"></i></button>
                </div>
            </div>`;
    }).join('');

    if (document.getElementById('cartTotal')) document.getElementById('cartTotal').innerText = `Rp ${total.toLocaleString()}`;
    if (document.getElementById('subtotal')) document.getElementById('subtotal').innerText = `Rp ${total.toLocaleString()}`;
    
    calculateChange();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function calculateChange() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const cash = document.getElementById('cashInput').value || 0;
    const change = cash - total;
    
    const changeDisplay = document.getElementById('changeAmount');
    if (changeDisplay) {
        changeDisplay.innerText = `Rp ${change < 0 ? 0 : change.toLocaleString()}`;
    }
}

function resetCart() {
    if (confirm("Hapus semua pesanan?")) {
        cart = [];
        document.getElementById('cashInput').value = '';
        renderCart();
    }
}

/* =========================================
   4. CHECKOUT & PRINT
   ========================================= */
function checkout() {
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const cash = document.getElementById('cashInput').value;

    if (cart.length === 0) return alert("Keranjang kosong!");
    if (!cash || cash < total) return alert("Uang tunai kurang!");

    let tempStock = JSON.parse(JSON.stringify(ingredients));
    let error = null;

    cart.forEach(item => {
        if (item.recipe) {
            item.recipe.forEach(r => {
                let ing = tempStock.find(i => i.id === r.id);
                if (ing) {
                    if (ing.stock < r.qty) error = `Stok ${ing.name} tidak cukup!`;
                    else ing.stock -= r.qty;
                }
            });
        }
    });

    if (error) return alert(error);

    // SIMPAN STOK TERBARU KE LOCALSTORAGE
    ingredients = tempStock;
    localStorage.setItem('inventory_data', JSON.stringify(ingredients));
    
    printReceipt(total, cash);
    
    alert("Transaksi Berhasil!");
    cart = [];
    document.getElementById('cashInput').value = '';
    renderCart();
}

function printReceipt(total, cash) {
    const change = cash - total;
    const date = new Date().toLocaleString('id-ID');
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    
    let itemsHtml = cart.map(item => `
        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>1x ${item.name}</span>
            <span>${item.price.toLocaleString()}</span>
        </div>
    `).join('');

    printWindow.document.write(`
        <html><body style="font-family:monospace; width:250px; padding:20px;">
            <center><strong>AYAM PENCAK</strong><br>${date}</center>
            <hr>
            ${itemsHtml}
            <hr>
            <div style="display:flex; justify-content:space-between;"><strong>Total</strong> <strong>${total.toLocaleString()}</strong></div>
            <div style="display:flex; justify-content:space-between;">Tunai <span>${parseInt(cash).toLocaleString()}</span></div>
            <div style="display:flex; justify-content:space-between;">Kembali <span>${change.toLocaleString()}</span></div>
            <hr><center>Terima Kasih</center>
            <script>window.print(); setTimeout(()=>window.close(), 500);</script>
        </body></html>
    `);
    printWindow.document.close();
}

/* =========================================
   5. RENDER STOK (DIPERBAIKI)
   ========================================= */
function renderInventory() {
    // Cek ID yang ada di HTML (bisa 'inventoryTable' atau 'inventoryTableBody')
    const tableBody = document.getElementById('inventoryTable') || document.getElementById('inventoryTableBody');
    if (!tableBody) return;

    // Selalu ambil data terbaru dari localStorage
    const data = JSON.parse(localStorage.getItem('inventory_data')) || ingredients;

    tableBody.innerHTML = data.map(ing => `
        <tr class="border-b border-gray-50">
            <td class="p-5 font-bold text-gray-700">${ing.name}</td>
            <td class="p-5 text-gray-600">${ing.stock} ${ing.unit}</td>
            <td class="p-5">
                <span class="px-3 py-1 ${ing.stock > 10 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-[10px] font-black rounded-full uppercase">
                    ${ing.stock > 10 ? 'Aman' : 'Tipis'}
                </span>
            </td>
        </tr>
    `).join('');
}