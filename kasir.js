/* =========================================
   JS/KASIR.JS - VERSI FIXED & OPTIMIZED
   ========================================= */
let cart = [];

/** 1. RENDER MENU **/
function renderMenu() {
    const menuList = document.getElementById('menuList');
    if (!menuList) return;

    const products = DB.getProducts(); 

    menuList.innerHTML = products.map(p => `
        <div onclick="addToCart('${p.id}')" class="bg-white overflow-hidden rounded-2xl shadow-sm border border-transparent active:scale-95 hover:border-green-500 transition cursor-pointer group">
            <div class="h-32 w-full overflow-hidden bg-gray-100">
                ${p.img.length > 10 
                    ? `<img src="${p.img}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" alt="${p.name}">` 
                    : `<div class="flex items-center justify-center h-full text-4xl">${p.img}</div>`
                }
            </div>
            <div class="p-3 text-center">
                <h3 class="font-bold text-gray-700 text-xs md:text-sm mb-1 truncate">${p.name}</h3>
                <p class="text-green-500 font-black text-xs">Rp ${p.price.toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

/** 2. TAMBAH KE KERANJANG (DENGAN PENGGABUNGAN QTY) **/
function addToCart(productId) {
    const products = DB.getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({...product, qty: 1});
        }
        renderCart();
        if (navigator.vibrate) navigator.vibrate(10); // Haptic feedback untuk Android
    }
}

/** 3. RENDER KERANJANG **/
function renderCart() {
    const cartDiv = document.getElementById('cartItems');
    if (!cartDiv) return;
    
    let total = 0;
    cartDiv.innerHTML = cart.map((item, index) => {
        const subtotal = item.price * item.qty;
        total += subtotal;
        return `
            <div class="flex justify-between items-center mb-3 border-b border-gray-50 pb-2">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-gray-700">${item.name}</span>
                    <span class="text-[10px] text-gray-400">${item.qty}x Rp ${item.price.toLocaleString()}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-gray-600">Rp ${subtotal.toLocaleString()}</span>
                    <button onclick="removeFromCart(${index})" class="text-red-400 p-1"><i class="fas fa-times-circle"></i></button>
                </div>
            </div>`;
    }).join('');

    const totalLabels = ['cartTotal', 'subtotal'];
    totalLabels.forEach(id => { 
        if(document.getElementById(id)) document.getElementById(id).innerText = `Rp ${total.toLocaleString()}`; 
    });
    calculateChange();
}

function removeFromCart(index) {
    if (cart[index].qty > 1) {
        cart[index].qty -= 1;
    } else {
        cart.splice(index, 1);
    }
    renderCart();
}

function calculateChange() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cashInput = document.getElementById('cashInput');
    const cash = cashInput ? (parseInt(cashInput.value) || 0) : 0;
    const change = cash - total;
    if (document.getElementById('changeAmount')) {
        document.getElementById('changeAmount').innerText = `Rp ${change < 0 ? 0 : change.toLocaleString()}`;
    }
}

/** 4. PROSES BAYAR **/
function checkout() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const cashInput = document.getElementById('cashInput');
    const cash = cashInput ? parseInt(cashInput.value) : 0;

    if (cart.length === 0) return alert("Keranjang kosong!");
    if (!cash || cash < total) return alert("Uang tunai kurang!");

    let ingredients = DB.getIngredients();
    let tempStock = JSON.parse(JSON.stringify(ingredients)); 
    let error = null;

    // Cek Stok
    cart.forEach(item => {
        if (item.recipe) {
            item.recipe.forEach(r => {
                let ing = tempStock.find(i => i.id === r.id);
                if (ing) {
                    const totalNeeded = r.qty * item.qty; // Resep dikali jumlah pesanan
                    if (ing.stock < totalNeeded) {
                        error = `Stok ${ing.name} tidak cukup!`;
                    } else {
                        ing.stock = parseFloat((ing.stock - totalNeeded).toFixed(2));
                    }
                }
            });
        }
    });

    if (error) return alert(error);

    // Salin data cart untuk struk sebelum cart dihapus
    const receiptData = [...cart];

    // Simpan Transaksi
    const salesReport = JSON.parse(localStorage.getItem('sales_report')) || [];
    salesReport.push({
        id: 'TRX-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString('id-ID'),
        items: cart.map(i => ({ name: i.name, qty: i.qty })),
        total: total
    });

    localStorage.setItem('sales_report', JSON.stringify(salesReport));
    DB.saveIngredients(tempStock);

    alert("Transaksi Berhasil!");
    
    // Cetak Struk menggunakan data cadangan
    printReceipt(receiptData, total, cash);

    // Reset
    cart = [];
    if (cashInput) cashInput.value = '';
    renderCart();
}

/** 5. STRUK PRINT (FIXED DATA) **/
/** 5. STRUK PRINT (VERSI COMPATIBLE ANDROID) **/
function printReceipt(items, total, cash) {
    const change = cash - total;
    const date = new Date().toLocaleString('id-ID');
    
    // Buat elemen bayangan untuk menampung konten struk
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow.document;
    
    doc.write(`
        <html>
        <head>
            <style>
                @page { size: 58mm auto; margin: 0; }
                body { 
                    font-family: 'Courier New', monospace; 
                    width: 58mm; 
                    padding: 10px; 
                    font-size: 11px; 
                    color: #000;
                }
                .text-center { text-align: center; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; }
                .row { display: flex; justify-content: space-between; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="text-center bold" style="font-size:14px">AYAM PENCAK</div>
            <div class="text-center">Point of Sale</div>
            <div class="divider"></div>
            <div>Tgl: ${date}</div>
            <div class="divider"></div>
            ${items.map(i => `
                <div class="row"><span>${i.name}</span></div>
                <div class="row" style="margin-bottom:3px">
                    <span style="padding-left:10px">${i.qty} x ${i.price.toLocaleString()}</span>
                    <span>${(i.qty * i.price).toLocaleString()}</span>
                </div>
            `).join('')}
            <div class="divider"></div>
            <div class="row bold"><span>TOTAL</span><span>${total.toLocaleString()}</span></div>
            <div class="row"><span>TUNAI</span><span>${cash.toLocaleString()}</span></div>
            <div class="row"><span>KEMBALI</span><span>${change.toLocaleString()}</span></div>
            <div class="divider"></div>
            <div class="text-center">TERIMA KASIH</div>
            <div style="height: 20px;"></div>
        </body>
        </html>
    `);

    doc.close();

    // Tunggu konten dimuat, lalu panggil print
    setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        // Hapus iframe setelah selesai (opsional)
        setTimeout(() => {
            document.body.removeChild(printFrame);
        }, 1000);
    }, 500);
}

function resetCart() {
    if (cart.length === 0) return;
    if (confirm("Hapus semua pesanan?")) {
        cart = [];
        if (document.getElementById('cashInput')) document.getElementById('cashInput').value = '';
        renderCart();
    }
}

// Global Exports
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.resetCart = resetCart;
window.checkout = checkout;

document.addEventListener('DOMContentLoaded', () => { renderMenu(); renderCart(); });
document.addEventListener('input', (e) => { if (e.target.id === 'cashInput') calculateChange(); });