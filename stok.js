/* =========================================
   LOGIKA MANAJEMEN STOK (FULL CRUD)
   ========================================= */

function renderInventory() {
    const tableBody = document.getElementById('inventoryTableBody');
    if (!tableBody) return;

    const data = DB.getIngredients();

    tableBody.innerHTML = data.map(ing => `
        <tr class="hover:bg-gray-50 transition">
            <td class="p-6 font-bold text-gray-700">${ing.name}</td>
            <td class="p-6 font-mono text-gray-600">${ing.stock}</td>
            <td class="p-6 text-gray-400">${ing.unit}</td>
            <td class="p-6">
                <span class="px-3 py-1 ${ing.stock > 10 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-[10px] font-black rounded-full uppercase">
                    ${ing.stock > 10 ? 'Aman' : 'Tipis'}
                </span>
            </td>
            <td class="p-6 text-right">
                <button onclick="openStockModal('${ing.id}')" class="text-blue-400 hover:text-blue-600 mr-4 transition">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteIngredient('${ing.id}')" class="text-red-300 hover:text-red-500 transition">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// FUNGSI MODAL
function openStockModal(id = null) {
    const modal = document.getElementById('stockModal');
    modal.classList.remove('hidden');
    
    if (id) {
        const ing = DB.getIngredients().find(i => i.id === id);
        document.getElementById('editIngId').value = id;
        document.getElementById('ingName').value = ing.name;
        document.getElementById('ingStock').value = ing.stock;
        document.getElementById('ingUnit').value = ing.unit;
    } else {
        document.getElementById('editIngId').value = '';
        document.getElementById('ingName').value = '';
        document.getElementById('ingStock').value = '';
    }
}

function closeStockModal() {
    document.getElementById('stockModal').classList.add('hidden');
}

// SIMPAN DATA KE LOCALSTORAGE
function saveIngredient() {
    const id = document.getElementById('editIngId').value;
    const name = document.getElementById('ingName').value;
    const stock = parseFloat(document.getElementById('ingStock').value);
    const unit = document.getElementById('ingUnit').value;

    if (!name || isNaN(stock)) return alert("Mohon isi data dengan benar!");

    let ingredients = DB.getIngredients();

    if (id) {
        // Mode Edit
        ingredients = ingredients.map(i => i.id === id ? { ...i, name, stock, unit } : i);
    } else {
        // Mode Tambah Baru
        ingredients.push({ id: 'i' + Date.now(), name, stock, unit });
    }

    DB.saveIngredients(ingredients);
    closeStockModal();
    renderInventory();
}

// HAPUS DATA
function deleteIngredient(id) {
    if (confirm("Hapus bahan ini?")) {
        const filtered = DB.getIngredients().filter(i => i.id !== id);
        DB.saveIngredients(filtered);
        renderInventory();
    }
}

document.addEventListener('DOMContentLoaded', renderInventory);