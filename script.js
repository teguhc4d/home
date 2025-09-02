// =======================
// script.js
// Semua logika: Tab, Agenda, Absensi, Catatan, Jadwal, Modul, Export CSV, localStorage.
// Penjelasan setiap baris menggunakan komentar //
// =======================

// ---------- KONSTANTA KEY localStorage ----------
// Menyimpan nama key dalam konstanta supaya konsisten dan mudah diubah nanti
const KEY_AGENDA   = "agendaKelas_v1";    // untuk menyimpan array agenda (string)
const KEY_ABSENSI  = "absensiKelas_v1";   // untuk menyimpan array objek {nama, status}
const KEY_CATATAN  = "catatanGuru_v1";    // untuk menyimpan string catatan guru
const KEY_JADWAL   = "jadwalKelas_v1";    // untuk menyimpan array jadwal [ [hari, mapel], ... ]
const KEY_MODUL    = "modulKelas_v1";     // untuk menyimpan array modul {name, dataUrl}

// ---------- FUNGSI NAVIGASI TAB ----------
// Fungsi ini menampilkan tab yang dipilih dan menandai tombol tab aktif.
// Parameter:
//   tabId: id dari elemen tab-content yang akan ditampilkan
//   btn  : (opsional) elemen tombol yang diklik, agar bisa ditandai aktif
function bukaTab(tabId, btn) {
  // Sembunyikan semua konten tab terlebih dahulu
  document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

  // Hapus kelas 'active' dari semua tombol tab
  document.querySelectorAll(".tab-button").forEach(b => b.classList.remove("active"));

  // Tampilkan konten tab yang dipilih dengan menambahkan kelas 'active'
  const konten = document.getElementById(tabId);
  if (konten) konten.classList.add("active");

  // Jika tombol diberikan melalui argumen, beri tanda active
  if (btn) {
    btn.classList.add("active");
    return;
  }

  // Jika tombol tidak diberikan (mis. HTML memanggil bukaTab('id') langsung),
  // coba cari tombol yang berpasangan berdasarkan urutan: tombol ke-i -> tab-content ke-i.
  // Ambil semua tombol dan tab-content dalam NodeList
  const tombol = Array.from(document.querySelectorAll(".tab-button"));
  const tabContents = Array.from(document.querySelectorAll(".tab-content"));

  // Cari index tabContents yang id-nya sama dengan tabId
  const idx = tabContents.findIndex(t => t.id === tabId);
  if (idx >= 0 && tombol[idx]) {
    tombol[idx].classList.add("active");
  }
}

// Untuk memastikan tombol tab yang ada di HTML selalu menjalankan bukaTab dengan btn yang benar,
// pasang event listener pada semua tombol tab saat DOM siap.
// Ini juga membuat perilaku lebih andal daripada mengandalkan inline onclick saja.
function initTabButtons() {
  const tombol = Array.from(document.querySelectorAll(".tab-button"));
  const tabContents = Array.from(document.querySelectorAll(".tab-content"));

  // Jika jumlah tombol sama dengan jumlah tab, kita buat pasangan berdasarkan index
  if (tombol.length === tabContents.length) {
    tombol.forEach((b, i) => {
      // Ambil id tab yang sesuai
      const tabId = tabContents[i].id;
      // Hapus atribut onclick lama (jika ada) dan pasang handler yang konsisten
      b.onclick = function() { bukaTab(tabId, b); };
      // Simpan dataset agar debugging lebih mudah
      b.dataset.tab = tabId;
    });
  } else {
    // Jika tidak sama, pasang event generic yang mencari tab berdasarkan teks tombol atau atribut data-tab
    tombol.forEach(b => {
      b.onclick = function() {
        // Prioritas: data-tab attribute jika ada
        const fromData = b.dataset.tab;
        if (fromData) {
          bukaTab(fromData, b);
          return;
        }
        // Jika tidak ada, coba gunakan nilai teks tombol untuk mencocokkan id (dengan sedikit normalisasi)
        const label = b.textContent.trim().toLowerCase();
        // Cari tab-content yang id-nya mengandung kata label
        const match = Array.from(document.querySelectorAll(".tab-content")).find(tc => tc.id.toLowerCase().includes(label));
        if (match) bukaTab(match.id, b);
      };
    });
  }
}

// ---------- UTILITY: Helper kecil ----------
// Membuat fungsi bantu untuk mengunduh teks sebagai file (CSV)
function downloadTextFile(filename, text) {
  // Buat anchor sementara
  const link = document.createElement("a");
  // Set href dengan data URI berisi teks yang sudah di-encode
  link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(text);
  // Nama file yang diunduh
  link.download = filename;
  // Tambahkan ke DOM agar bisa di-click
  document.body.appendChild(link);
  // Klik otomatis
  link.click();
  // Hapus anchor
  document.body.removeChild(link);
}

// ---------- FUNGSI AGENDA ----------
// Menambah agenda baru ke DOM dan simpan ke localStorage
function tambahAgenda() {
  // Ambil nilai dari input
  const input = document.getElementById("agendaInput");
  const teks = input ? input.value.trim() : "";

  // Validasi: tidak boleh kosong
  if (!teks) {
    alert("Agenda tidak boleh kosong!");
    return;
  }

  // Buat elemen li untuk menampilkan agenda
  const li = document.createElement("li");
  // Gunakan span agar ketika menyimpan kita bisa mengambil hanya teksnya (bukan tombol)
  const span = document.createElement("span");
  span.textContent = teks;
  li.appendChild(span);

  // Buat tombol hapus untuk tiap item agenda
  const btnHapus = document.createElement("button");
  btnHapus.textContent = "Hapus";
  btnHapus.className = "delete-btn";
  // Ketika diklik, hapus li dari DOM dan update penyimpanan
  btnHapus.onclick = function() {
    li.remove();
    simpanAgenda();
  };
  li.appendChild(btnHapus);

  // Tambahkan li ke daftar di halaman
  const list = document.getElementById("agendaList");
  if (list) list.appendChild(li);

  // Kosongkan input setelah menambah
  if (input) input.value = "";

  // Simpan ke localStorage
  simpanAgenda();
}

// Simpan semua agenda (dari DOM) ke localStorage
function simpanAgenda() {
  const arr = [];
  document.querySelectorAll("#agendaList li").forEach(li => {
    // Ambil teks dari span (jika ada) atau seluruh teks li sebagai fallback
    const teks = li.querySelector("span") ? li.querySelector("span").textContent : li.textContent;
    arr.push(teks);
  });
  // Simpan sebagai JSON string
  localStorage.setItem(KEY_AGENDA, JSON.stringify(arr));
}

// Muat agenda dari localStorage ke DOM (dipanggil saat inisialisasi)
function muatAgenda() {
  // Ambil data (jika tidak ada, gunakan array kosong)
  const arr = JSON.parse(localStorage.getItem(KEY_AGENDA) || "[]");
  const list = document.getElementById("agendaList");
  if (!list) return;
  // Kosongkan dahulu
  list.innerHTML = "";
  // Buat elemen li untuk tiap agenda
  arr.forEach(teks => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = teks;
    li.appendChild(span);

    const btnHapus = document.createElement("button");
    btnHapus.textContent = "Hapus";
    btnHapus.className = "delete-btn";
    btnHapus.onclick = function() {
      li.remove();
      simpanAgenda();
    };
    li.appendChild(btnHapus);
    list.appendChild(li);
  });
}

// Export agenda ke CSV
function exportAgendaCSV() {
  const arr = JSON.parse(localStorage.getItem(KEY_AGENDA) || "[]");
  if (!arr.length) {
    alert("Tidak ada data agenda untuk diexport!");
    return;
  }
  // Buat header CSV dan tiap baris dengan escaping sederhana
  let csv = "Agenda Kelas\n";
  arr.forEach(item => {
    const safe = ("" + item).replace(/"/g, '""'); // ganti " menjadi ""
    csv += `"${safe}"\n`;
  });
  // Unduh file
  downloadTextFile("agenda_kelas.csv", csv);
}

// ---------- FUNGSI ABSENSI ----------
// Menandai absen: tambah atau update jika sudah ada
function tandaiAbsen() {
  // Ambil nama & status
  const namaEl = document.getElementById("siswaSelect");
  const statusEl = document.getElementById("statusSelect");
  const nama = namaEl ? namaEl.value : "";
  const status = statusEl ? statusEl.value : "";

  // Validasi
  if (!nama || !status) {
    alert("Pilih nama siswa dan status!");
    return;
  }

  const tbody = document.getElementById("absenList");
  if (!tbody) return;

  // Cek apakah siswa sudah ada (cari berdasarkan nama)
  let ditemukan = false;
  tbody.querySelectorAll("tr").forEach(tr => {
    const namaCell = tr.cells[0] ? tr.cells[0].textContent : "";
    if (namaCell === nama) {
      // Jika ditemukan, update status
      if (tr.cells[1]) tr.cells[1].textContent = status;
      ditemukan = true;
    }
  });

  // Jika belum ditemukan, buat baris baru
  if (!ditemukan) {
    const tr = document.createElement("tr");
    const tdNama = document.createElement("td");
    tdNama.textContent = nama;
    const tdStatus = document.createElement("td");
    tdStatus.textContent = status;
    const tdAksi = document.createElement("td");
    // Tombol hapus untuk baris absensi
    const btnHapus = document.createElement("button");
    btnHapus.textContent = "Hapus";
    btnHapus.className = "delete-btn";
    btnHapus.onclick = function() {
      tr.remove();
      simpanAbsensi();
    };
    tdAksi.appendChild(btnHapus);

    tr.appendChild(tdNama);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAksi);
    tbody.appendChild(tr);
  }

  // Reset dropdown agar siap input berikutnya
  if (namaEl) namaEl.value = "";
  if (statusEl) statusEl.value = "";

  // Simpan perubahan ke localStorage
  simpanAbsensi();
}

// Simpan data absensi dari DOM ke localStorage
function simpanAbsensi() {
  const arr = [];
  document.querySelectorAll("#absenList tr").forEach(tr => {
    const nama = tr.cells[0] ? tr.cells[0].textContent : "";
    const status = tr.cells[1] ? tr.cells[1].textContent : "";
    if (nama) arr.push({ nama, status });
  });
  localStorage.setItem(KEY_ABSENSI, JSON.stringify(arr));
}

// Muat data absensi dari localStorage ke DOM
function muatAbsensi() {
  const arr = JSON.parse(localStorage.getItem(KEY_ABSENSI) || "[]");
  const tbody = document.getElementById("absenList");
  if (!tbody) return;
  tbody.innerHTML = "";
  arr.forEach(item => {
    const tr = document.createElement("tr");
    const tdNama = document.createElement("td");
    tdNama.textContent = item.nama;
    const tdStatus = document.createElement("td");
    tdStatus.textContent = item.status;
    const tdAksi = document.createElement("td");
    const btnHapus = document.createElement("button");
    btnHapus.textContent = "Hapus";
    btnHapus.className = "delete-btn";
    btnHapus.onclick = function() {
      tr.remove();
      simpanAbsensi();
    };
    tdAksi.appendChild(btnHapus);
    tr.appendChild(tdNama);
    tr.appendChild(tdStatus);
    tr.appendChild(tdAksi);
    tbody.appendChild(tr);
  });
}

// Export absensi ke CSV
function exportAbsensiCSV() {
  const arr = JSON.parse(localStorage.getItem(KEY_ABSENSI) || "[]");
  if (!arr.length) {
    alert("Tidak ada data absensi untuk diexport!");
    return;
  }
  let csv = "Nama Siswa,Status\n";
  arr.forEach(item => {
    const n = ("" + item.nama).replace(/"/g, '""');
    const s = ("" + item.status).replace(/"/g, '""');
    csv += `"${n}","${s}"\n`;
  });
  downloadTextFile("absensi_kelas.csv", csv);
}

// ---------- FUNGSI CATATAN GURU ----------
// Simpan catatan guru ke localStorage dan tampilkan di halaman
function simpanCatatan() {
  const el = document.getElementById("catatanInput");
  const teks = el ? el.value.trim() : "";
  if (!teks) {
    alert("Catatan tidak boleh kosong!");
    return;
  }
  // Simpan string langsung
  localStorage.setItem(KEY_CATATAN, teks);
  // Tampilkan di area catatan tersimpan
  const display = document.getElementById("catatanDisplay");
  if (display) display.textContent = teks;
  // Kosongkan textarea agar terlihat lebih rapi
  if (el) el.value = "";
}

// Muat catatan dari localStorage ke DOM
function muatCatatan() {
  const teks = localStorage.getItem(KEY_CATATAN) || "";
  const display = document.getElementById("catatanDisplay");
  if (display) display.textContent = teks ? teks : "Belum ada catatan.";
}

// Export catatan ke CSV (satu kolom)
function exportCatatanCSV() {
  const teks = localStorage.getItem(KEY_CATATAN) || "";
  if (!teks) {
    alert("Tidak ada catatan untuk diexport!");
    return;
  }
  const safe = teks.replace(/"/g, '""');
  const csv = `Catatan Guru\n"${safe}"\n`;
  downloadTextFile("catatan_guru.csv", csv);
}

// ---------- FUNGSI JADWAL ----------
// Simpan jadwal dari tabel (DOM) ke localStorage
function simpanJadwal() {
  const rows = [];
  // Ambil semua baris di tbody jadwal (skip header)
  document.querySelectorAll("#jadwalTable tbody tr").forEach(tr => {
    const hari = tr.cells[0] ? tr.cells[0].textContent : "";
    // Mata pelajaran bersifat contenteditable, ambil teksnya
    const mapel = tr.cells[1] ? tr.cells[1].textContent : "";
    rows.push([hari, mapel]);
  });
  localStorage.setItem(KEY_JADWAL, JSON.stringify(rows));
  alert("Jadwal tersimpan.");
}

// Muat jadwal dari localStorage; jika ada data, ganti isi tabel
function muatJadwal() {
  const data = JSON.parse(localStorage.getItem(KEY_JADWAL) || "[]");
  if (!data.length) return; // kalau kosong, biarkan jadwal default di HTML
  const tbody = document.querySelector("#jadwalTable tbody");
  if (!tbody) return;
  // Kosongkan isi tbody lalu bangun ulang dari data
  tbody.innerHTML = "";
  data.forEach(pair => {
    const tr = document.createElement("tr");
    const tdHari = document.createElement("td");
    tdHari.textContent = pair[0];
    const tdMapel = document.createElement("td");
    // Biarkan editable agar guru bisa ubah langsung
    tdMapel.contentEditable = "true";
    tdMapel.textContent = pair[1];
    tr.appendChild(tdHari);
    tr.appendChild(tdMapel);
    tbody.appendChild(tr);
  });
}

// ---------- FUNGSI MODUL (UPLOAD -> SIMPAN ke localStorage SEBAGAI dataURL) ----------
// Catatan: menyimpan file sebagai dataURL (base64) ke localStorage dapat memakan banyak ruang.
// Gunakan untuk file kecil (PDF/PNG kecil). Untuk file besar, sebaiknya gunakan backend.
function uploadModul() {
  const input = document.getElementById("modulInput");
  if (!input || !input.files || input.files.length === 0) {
    alert("Pilih file modul dulu!");
    return;
  }

  // Ambil file pertama (bisa diperluas untuk multiple files)
  const file = input.files[0];

  // Baca file sebagai DataURL menggunakan FileReader
  const reader = new FileReader();
  reader.onload = function(e) {
    // dataUrl berisi base64 + mime-type
    const dataUrl = e.target.result;

    // Ambil array modul yang sudah ada atau inisialisasi array baru
    const arr = JSON.parse(localStorage.getItem(KEY_MODUL) || "[]");

    // Tambahkan modul baru sebagai objek {name, dataUrl}
    arr.push({ name: file.name, dataUrl: dataUrl });

    // Simpan kembali ke localStorage
    localStorage.setItem(KEY_MODUL, JSON.stringify(arr));

    // Perbarui tampilan daftar modul di DOM
    muatModul();

    // Kosongkan input file agar bisa upload file yang sama kemudian
    input.value = "";
  };

  // Mulai membaca file
  reader.readAsDataURL(file);
}

// Muat daftar modul dari localStorage dan tampilkan di DOM
function muatModul() {
  const arr = JSON.parse(localStorage.getItem(KEY_MODUL) || "[]");
  const list = document.getElementById("modulList");
  if (!list) return;
  // Kosongkan daftar lama
  list.innerHTML = "";

  // Jika tidak ada modul, tampilkan pesan
  if (!arr.length) {
    const li = document.createElement("li");
    li.textContent = "Belum ada modul.";
    list.appendChild(li);
    return;
  }

  // Untuk setiap modul, buat item dengan tombol download & hapus
  arr.forEach((m, idx) => {
    const li = document.createElement("li");
    li.className = "module-item";

    // Nama file
    const span = document.createElement("span");
    span.textContent = m.name;

    // Link download menggunakan dataUrl
    const a = document.createElement("a");
    a.href = m.dataUrl;
    a.download = m.name;
    a.textContent = "Download";

    // Tombol hapus modul
    const btnHapus = document.createElement("button");
    btnHapus.textContent = "Hapus";
    btnHapus.className = "delete-btn";
    btnHapus.onclick = function() {
      // Hapus dari array berdasarkan index, simpan ulang, lalu refresh tampilan
      const arr2 = JSON.parse(localStorage.getItem(KEY_MODUL) || "[]");
      arr2.splice(idx, 1); // hapus item ke-idx
      localStorage.setItem(KEY_MODUL, JSON.stringify(arr2));
      muatModul();
    };

    // Susun tampilan: nama di kiri, aksi (download + hapus) di kanan
    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.gap = "8px";
    right.appendChild(a);
    right.appendChild(btnHapus);

    li.appendChild(span);
    li.appendChild(right);
    list.appendChild(li);
  });
}

// ---------- EXPORT CSV GENERIC untuk jadwal/ catatan jika diperlukan ----------
// (Bisa digunakan untuk menambah fitur ekspor jadwal jika diinginkan)
function exportCSVFromArray(headerLine, rowsArray, filename) {
  // headerLine: string header (contoh: "Nama,Status")
  // rowsArray: array of arrays (contoh: [ ["Andi","Hadir"], ["Budi","Izin"] ])
  // filename: nama file output
  if (!rowsArray || !rowsArray.length) {
    alert("Tidak ada data untuk diexport!");
    return;
  }
  let csv = headerLine + "\n";
  rowsArray.forEach(r => {
    // escape setiap value sederhana
    const safe = r.map(v => `"${String(v).replace(/"/g, '""')}"`);
    csv += safe.join(",") + "\n";
  });
  downloadTextFile(filename, csv);
}

// ---------- INISIALISASI: MUAT DATA SAAT HALAMAN SIAP ----------
// Pasang event untuk menjalankan muatan data saat DOM siap
window.addEventListener("DOMContentLoaded", function() {
  // Inisialisasi tab buttons agar klikannya konsisten
  initTabButtons();

  // Muat semua data dari localStorage ke DOM
  muatAgenda();
  muatAbsensi();
  muatCatatan();
  muatJadwal();
  muatModul();

  // Jika di HTML ada tombol export catatan, kita bisa pasang handler (opsional)
  // (Tidak wajib — exportCatatanCSV tersedia jika ingin dipanggil)
});

// ---------- OPTIONAL: Simpan sebelum halaman ditutup (redundan tapi aman) ----------
window.addEventListener("beforeunload", function() {
  // Pastikan data tersimpan; kebanyakan perubahan sudah langsung disimpan di setiap aksi
  simpanAgenda();
  simpanAbsensi();
  // Catatan, jadwal, dan modul sudah disimpan pada setiap aksi pengguna
});
