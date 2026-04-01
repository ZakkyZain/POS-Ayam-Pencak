/* =========================================
   CORE DATA & STORAGE HELPER (FINAL FIXED)
   ========================================= */

const initialIngredients = [
    { id: 'i1', name: 'Ayam', stock: 50, unit: 'pcs' },
    { id: 'i2', name: 'Nasi Putih', stock: 5000, unit: 'gram' },
    { id: 'i3', name: 'Cabe Rawit', stock: 100, unit: 'biji' },
    { id: 'i4', name: 'Minyak Goreng', stock: 1000, unit: 'ml' },
    { id: 'i5', name: 'Teh', stock: 10, unit: 'Liter' },
    { id: 'i6', name: 'Air', stock: 10, unit: 'Liter' },
    { id: 'i7', name: 'Jeruk', stock: 20, unit: 'pcs' } // Tambahan agar Es Jeruk ada stoknya
];

const defaultProducts = [
    { 
        id: 'p1', 
        name: 'Ayam Geprek Sambal Bawang', 
        price: 10000, 
        img: 'asset/Ayam Pencak Signatur.jpg', 
        recipe: [{ id: 'i1', qty: 1 }, { id: 'i2', qty: 100 }, { id: 'i3', qty: 5 }] 
    },
    { 
        id: 'p2', 
        name: 'Ayam Geprek Ricis', 
        price: 13000, 
        img: '', 
        recipe: [{ id: 'i1', qty: 1 }] 
    },
    { 
        id: 'p3', // ID Unik
        name: 'Es Teh Manis', 
        price: 3000, 
        img: 'asset/Es Teh.jpg', 
        recipe: [{ id: 'i5', qty: 0.25 }] 
    },
    {
        id: 'p4', // ID Unik
        name: 'Es Jeruk', 
        price: 4000, 
        img: 'asset/Es Jeruk.jpg', 
        recipe: [{ id: 'i7', qty: 1 }] // Mengurangi 1 buah jeruk
    },
    {
        id: 'p5', // ID Unik
        name: 'Air Putih', 
        price: 3000, 
        img: 'asset/Air.jpg', 
        recipe: [{ id: 'i6', qty: 0.25 }] 
    }
];

const DB = {
    getIngredients: () => JSON.parse(localStorage.getItem('inventory_data')) || initialIngredients,
    saveIngredients: (data) => localStorage.setItem('inventory_data', JSON.stringify(data)),
    getProducts: () => JSON.parse(localStorage.getItem('products_data')) || defaultProducts,
    saveProducts: (data) => localStorage.setItem('products_data', JSON.stringify(data)),
    getTransactions: () => JSON.parse(localStorage.getItem('sales_report')) || [],
    getArchive: () => JSON.parse(localStorage.getItem('sales_archive')) || {},
    
    saveToArchive: (date, data) => {
        const archive = DB.getArchive();
        archive[date] = data; 
        localStorage.setItem('sales_archive', JSON.stringify(archive));
    },

    initDailySession: () => {
        const today = new Date().toLocaleDateString('en-CA'); 
        const lastDate = localStorage.getItem('last_session_date');
        const currentSales = DB.getTransactions();

        if (lastDate && lastDate !== today) {
            if (currentSales.length > 0) DB.saveToArchive(lastDate, currentSales);
            localStorage.removeItem('sales_report');
            localStorage.setItem('last_session_date', today);
        }

        if (!lastDate) localStorage.setItem('last_session_date', today);
    }
};

// Auto-update data jika ada menu baru
if (localStorage.getItem('products_data')) {
    const currentData = JSON.parse(localStorage.getItem('products_data'));
    if (currentData.length !== defaultProducts.length) {
        localStorage.removeItem('products_data');
        localStorage.removeItem('inventory_data');
    }
}

DB.initDailySession(); 
if (!localStorage.getItem('inventory_data')) DB.saveIngredients(initialIngredients);
if (!localStorage.getItem('products_data')) DB.saveProducts(defaultProducts);