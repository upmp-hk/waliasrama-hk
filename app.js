// app.js
(function () {
  const { createClient } = supabase;

  const SUPABASE_URL = "https://szbhghiryzbfivriksnu.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6YmhnaGlyeXpiZml2cmlrc251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzIwNTYsImV4cCI6MjA3OTkwODA1Nn0.0FJ_Fu5qv7n6mnsNd9rWRJ80yHr2T31ar4q8Rv4rWbo";

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // DOM ELEMENTS
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabInput = document.getElementById("tab-input");
  const tabRekapHarian = document.getElementById("tab-rekap-harian");
  const tabRekapBulanan = document.getElementById("tab-rekap-bulanan");
  const panelFilterInput = document.getElementById("panelFilterInput");
  const panelDaftarInput = document.getElementById("panelDaftarInput");

  const inputTanggal = document.getElementById("inputTanggal");
  const inputJenjang = document.getElementById("inputJenjang");
  const inputKelas = document.getElementById("inputKelas");
  const inputJurusan = document.getElementById("inputJurusan");
  const inputParalel = document.getElementById("inputParalel");
  const btnLoadInput = document.getElementById("btnLoadInput");
  const btnSaveInput = document.getElementById("btnSaveInput");
  const inputTableBody = document.getElementById("inputTableBody");
  const inputLokasi = document.getElementById("inputLokasi");
  const fieldLokasi = document.getElementById("fieldLokasi");
  const fieldKelas = document.getElementById("fieldKelas");
  const fieldJurusan = document.getElementById("fieldJurusan");
  const fieldParalel = document.getElementById("fieldParalel");

  const kelasChipGroup = document.querySelector('.chip-group[data-target="inputKelas"]');
  const paralelChipGroup = document.querySelector('.chip-group[data-target="inputParalel"]');

  const rekapTanggal = document.getElementById("rekapTanggal");
  const btnLoadRekap = document.getElementById("btnLoadRekap");
  const btnSaveRekap = document.getElementById("btnSaveRekap");
  const btnPrintRekap = document.getElementById("btnPrintRekap");
  const rekapTableBody = document.getElementById("rekapTableBody");

  const rekapBulan = document.getElementById("rekapBulan");
  const btnLoadRekapBulanan = document.getElementById("btnLoadRekapBulanan");
  const btnPrintRekapBulanan = document.getElementById("btnPrintRekapBulanan");
  const monthlyChartContainer = document.getElementById("monthlyChartContainer");

  const alasanList = document.getElementById("alasanList");
  const toastEl = document.getElementById("toast");

  // PWA INSTALL
  const installPromptContainer = document.getElementById("installPromptContainer");
  const btnInstallApp = document.getElementById("btnInstallApp");
  let deferredPwaPrompt = null;

  // STATE
  let santriMaster = [];
  let santriById = new Map(); 
  let alasanSakitDistinct = [];
  let toastEnabled = false;

  let activeTab = "input";
  let isSwitchingTab = false;

  let inputStep = "filter";          // "filter" atau "daftar"
  let isSwitchingInputPanel = false; // cegah animasi tabrakan

  // ===== UTIL LOADING BUTTON =====
  function setButtonLoading(btn, isLoading, labelLoading = "Memproses...") {
    if (!btn) return;
    if (!btn.dataset.labelDefault) {
      btn.dataset.labelDefault = btn.innerHTML;
    }
    if (isLoading) {
      btn.disabled = true;
      btn.classList.add("loading");
      btn.innerHTML = labelLoading;
    } else {
      btn.disabled = false;
      btn.classList.remove("loading");
      btn.innerHTML = btn.dataset.labelDefault;
    }
  }

  // ===== TOAST =====
  function showToast(message, variant = "info") {
    if (!toastEnabled) {
      return;
    }

    if (!toastEl) {
      alert(message);
      return;
    }

    if (variant === "auto") {
      const lower = message.toLowerCase();

      if (message.includes("✅") || lower.includes("berhasil") || lower.includes("sukses")) {
        variant = "success";
      } else if (message.includes("❎") || lower.includes("gagal") || lower.includes("error")) {
        variant = "error";
      } else if (message.includes("⚠️") || lower.includes("harap") || lower.includes("periksa")) {
        variant = "warning";
      } else if (lower.includes("info") || lower.includes("catatan")) {
        variant = "neutral";
      } else {
        variant = "info";
      }
    }

    toastEl.textContent = message;
    toastEl.className = "toast";

    switch (variant) {
      case "success":
        toastEl.classList.add("toast-success");
        break;
      case "error":
        toastEl.classList.add("toast-error");
        break;
      case "warning":
        toastEl.classList.add("toast-warning");
        break;
      case "neutral":
        toastEl.classList.add("toast-neutral");
        break;
      case "info":
      default:
        toastEl.classList.add("toast-info");
        break;
    }

    toastEl.classList.add("show");
    clearTimeout(showToast._timeoutId);
    showToast._timeoutId = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2500);
  }

  function showToastAuto(message) {
    showToast(message, "auto");
  }

  // ===== CHIP GROUP HANDLER =====
  function initChipGroups() {
    document.querySelectorAll(".chip-group").forEach((group) => {
      const targetId = group.dataset.target;
      const hiddenInput = document.getElementById(targetId);
      if (!hiddenInput) return;

      const buttons = group.querySelectorAll(".chip-option");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          hiddenInput.value = btn.dataset.value || "";
        });
      });
    });
  }

  function filterChipByJenjang(chipGroupEl, jenjang) {
    const buttons = chipGroupEl.querySelectorAll(".chip-option");
    let selected = null;
  
    buttons.forEach((btn) => {
      const btnJenjang = btn.dataset.jenjang;
      const visible = !btnJenjang || btnJenjang === jenjang;
  
      btn.style.display = visible ? "inline-flex" : "none";
      if (!visible) btn.classList.remove("active");
      else if (!selected) selected = btn;
    });
  
    if (selected) {
      const target = chipGroupEl.dataset.target;
      document.getElementById(target).value = selected.dataset.value;
      selected.classList.add("active");
    }
  }
 
  function updateKelasOptionsByJenjang() {
    const jenjang = inputJenjang.value;
    filterChipByJenjang(kelasChipGroup, jenjang);
  }
  
  function updateParalelOptionsByJenjang() {
    const jenjang = inputJenjang.value;
    filterChipByJenjang(paralelChipGroup, jenjang);
  }
  
  function updateJurusanVisibility() {
    const jenjang = inputJenjang.value;
    if (!fieldJurusan) return;
  
    if (jenjang === "MA") {
      fieldJurusan.style.display = "";
      if (!inputJurusan.value) {
        inputJurusan.value = "IPA";
      }
    } else {
      fieldJurusan.style.display = "none";
      inputJurusan.value = "";
    }
  }
  
  function updateLokasiVisibility() {
    const jenjang = inputJenjang.value;
    if (!fieldLokasi) return;
  
    // Lokasi hanya berlaku untuk MTs
    if (jenjang === "MTs") {
      fieldLokasi.style.display = "";
      if (!inputLokasi.value) {
        inputLokasi.value = "HK 1";
      }
    } else {
      fieldLokasi.style.display = "none";
      inputLokasi.value = "";
    }
  }
  
  function applyJenjangLayout() {
    const jenjang = inputJenjang.value;
  
    // MTs → lokasi + kelas (VII–IX), paralel A–O, jurusan hidden
    if (jenjang === "MTs") {
      fieldLokasi.style.display = "";
      fieldJurusan.style.display = "none";
  
      filterChipByJenjang(kelasChipGroup, "MTs");
      filterChipByJenjang(paralelChipGroup, "MTs");
  
      inputJurusan.value = ""; // MA only
      if (!inputLokasi.value) inputLokasi.value = "HK 1";
    }
  
    // MA → kelas (X–XII) + jurusan, paralel 1–15, lokasi hidden
    else if (jenjang === "MA") {
      fieldLokasi.style.display = "none";
      fieldJurusan.style.display = "";
  
      filterChipByJenjang(kelasChipGroup, "MA");
      filterChipByJenjang(paralelChipGroup, "MA");
  
      inputLokasi.value = ""; // MTs only
      if (!inputJurusan.value) inputJurusan.value = "IPA";
    }
  }

  // ===== UTIL TANGGAL =====
  function setTodayToInputs() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const val = `${yyyy}-${mm}-${dd}`;
    inputTanggal.value = val;
    rekapTanggal.value = val;
  }

  function setThisMonthToRekapBulan() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    rekapBulan.value = `${yyyy}-${mm}`;
  }

  function getSectionByTab(tab) {
    if (tab === "input") return tabInput;
    if (tab === "rekap-harian") return tabRekapHarian;
    if (tab === "rekap-bulanan") return tabRekapBulanan;
    return null;
  }

  // ===== SWITCH TAB (NAV BAWAH) =====
  function switchTab(tab, options = {}) {
    const { instant = false } = options;
    if (!["input", "rekap-harian", "rekap-bulanan"].includes(tab)) return;

    const newSection = getSectionByTab(tab);
    const oldSection = getSectionByTab(activeTab);

    if (!newSection) return;
    if (tab === activeTab && !instant) return;
    if (isSwitchingTab && !instant) return;

    tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    localStorage.setItem("sakit_active_tab", tab);

    // mode tanpa animasi
    if (instant) {
      [tabInput, tabRekapHarian, tabRekapBulanan].forEach((sec) => {
        if (!sec) return;
        sec.style.display = sec === newSection ? "block" : "none";
        sec.classList.remove(
          "tab-content-active",
          "tab-content-hidden",
          "tab-anim-in-up",
          "tab-anim-out-left"
        );
        if (sec === newSection) {
          sec.classList.add("tab-content-active");
        } else {
          sec.classList.add("tab-content-hidden");
        }
      });

      activeTab = tab;
      isSwitchingTab = false;
      return;
    }

    // mode dengan animasi
    isSwitchingTab = true;
    activeTab = tab;

    newSection.style.display = "block";
    newSection.classList.remove("tab-content-hidden", "tab-anim-out-left");
    newSection.classList.add("tab-content-active", "tab-anim-in-up");

    if (!oldSection || oldSection === newSection) {
      newSection.classList.remove("tab-anim-in-up");
      isSwitchingTab = false;
      return;
    }

    oldSection.classList.remove("tab-anim-in-up");
    oldSection.classList.add("tab-anim-out-left");

    const handleOldAnimEnd = (e) => {
      if (e.animationName !== "tab-slide-out-left") return;
      oldSection.style.display = "none";
      oldSection.classList.remove("tab-anim-out-left", "tab-content-active");
      oldSection.classList.add("tab-content-hidden");
      oldSection.removeEventListener("animationend", handleOldAnimEnd);
    };

    const handleNewAnimEnd = (e) => {
      if (e.animationName !== "tab-slide-in-up") return;
      newSection.classList.remove("tab-anim-in-up");
      newSection.removeEventListener("animationend", handleNewAnimEnd);
      isSwitchingTab = false;
    };

    oldSection.addEventListener("animationend", handleOldAnimEnd);
    newSection.addEventListener("animationend", handleNewAnimEnd);
  }

  // ===== SWITCH PANEL INPUT (FILTER <-> DAFTAR) =====
  function switchInputPanel(step, options = {}) {
    const { instant = false } = options;
    if (!["filter", "daftar"].includes(step)) return;

    const newPanel = step === "filter" ? panelFilterInput : panelDaftarInput;
    const oldPanel = inputStep === "filter" ? panelFilterInput : panelDaftarInput;

    if (!newPanel) return;
    if (newPanel === oldPanel && !instant) return;
    if (isSwitchingInputPanel && !instant) return;

    inputStep = step;

    if (instant) {
      [panelFilterInput, panelDaftarInput].forEach((p) => {
        if (!p) return;
        p.style.display = p === newPanel ? "block" : "none";
        p.classList.remove("tab-anim-out-left", "tab-anim-in-up");
      });
      isSwitchingInputPanel = false;
      return;
    }

    isSwitchingInputPanel = true;

    newPanel.style.display = "block";
    newPanel.classList.remove("tab-anim-out-left");
    newPanel.classList.add("tab-anim-in-up");

    if (!oldPanel || oldPanel === newPanel) {
      const handleNewEndOnly = (e) => {
        if (e.animationName !== "tab-slide-in-up") return;
        newPanel.classList.remove("tab-anim-in-up");
        newPanel.removeEventListener("animationend", handleNewEndOnly);
        isSwitchingInputPanel = false;
      };
      newPanel.addEventListener("animationend", handleNewEndOnly);
      return;
    }

    oldPanel.classList.remove("tab-anim-in-up");
    oldPanel.classList.add("tab-anim-out-left");

    const handleOldEnd = (e) => {
      if (e.animationName !== "tab-slide-out-left") return;
      oldPanel.style.display = "none";
      oldPanel.classList.remove("tab-anim-out-left");
      oldPanel.removeEventListener("animationend", handleOldEnd);
    };

    const handleNewEnd = (e) => {
      if (e.animationName !== "tab-slide-in-up") return;
      newPanel.classList.remove("tab-anim-in-up");
      newPanel.removeEventListener("animationend", handleNewEnd);
      isSwitchingInputPanel = false;
    };

    oldPanel.addEventListener("animationend", handleOldEnd);
    newPanel.addEventListener("animationend", handleNewEnd);
  }

  // ===== DATAlist ALASAN =====
  function fillAlasanDatalist() {
    alasanList.innerHTML = "";
    const seen = new Set();
    alasanSakitDistinct.forEach((a) => {
      const text = (a || "").trim();
      if (!text) return;
      if (seen.has(text.toLowerCase())) return;
      seen.add(text.toLowerCase());
      const opt = document.createElement("option");
      opt.value = text;
      alasanList.appendChild(opt);
    });
  }

  // ===== UTIL BULAN =====
  function getMonthRange(monthStr) {
    const [yearStr, monthStr2] = monthStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr2);
    if (!year || !month) return null;

    const daysInMonth = new Date(year, month, 0).getDate();

    const mm = String(month).padStart(2, "0");
    const start = `${year}-${mm}-01`;
    const end = `${year}-${mm}-${String(daysInMonth).padStart(2, "0")}`;

    return { start, end, daysInMonth, year, month };
  }

    // ===== LOAD MASTER =====
    async function loadSantriMaster() {
      const { data, error } = await db
        .from("santri_master_view")
        .select(
          // sesuai schema tabel yang kamu kirim
          "id, nis, nama, tahun_ajaran, semester, jenjang, kelas, jurusan, paralel, aktif, created_at"
        )
        .eq("aktif", true)                 // boleh pakai filter aktif langsung, karena boolean
        .order("nama", { ascending: true });
    
      if (error) {
        console.error("Gagal load santri_master_view:", error);
        showToast("❎ gagal memuat data santri.", "error");
        santriMaster = [];
        santriById = new Map();
        return;
      }
    
      santriMaster = data || [];
      santriById = new Map(santriMaster.map((s) => [s.id, s]));
    
      console.log("santriMaster loaded:", santriMaster.length, "baris");
    }

  async function loadDistinctAlasanSakit() {
    const { data, error } = await db
      .from("santri_sakit")
      .select("alasan_sakit")
      .not("alasan_sakit", "is", null);

    if (error) {
      console.error("Gagal load alasan_sakit:", error);
      return;
    }
    alasanSakitDistinct = (data || []).map((d) => d.alasan_sakit);
    fillAlasanDatalist();
  }

  // ===== INPUT DATA =====
  async function loadInputTable() {
    const tanggal = inputTanggal.value;
    const jenjang = inputJenjang.value;
    const lokasi = inputLokasi.value;
    const kelas = inputKelas.value;
    const jurusan = inputJurusan.value;
    const paralel = inputParalel.value; // STRING, bisa huruf (A–O) atau angka ("1"–"15")

    if (!tanggal) {
      showToast("⚠️ pilih tanggal rekap.", "error");
      return;
    }

    setButtonLoading(
      btnLoadInput,
      true,
      '<span class="icon">⏳</span> Memuat...'
    );

    try {
      let santri = santriMaster.filter((s) => {
        const sameJenjang =
          (s.jenjang || "").toString().toUpperCase() === jenjang.toUpperCase();
        const sameKelas =
          (s.kelas || "").toString().toUpperCase() === kelas.toUpperCase();
        const sameParalel = String(s.paralel) === String(paralel);
      
        // aktif bisa berupa true / "true" / 1 / "1" / "AKTIF"
        const valAktif = (s.aktif ?? "").toString().toUpperCase();
        const isAktif =
          valAktif === "TRUE" ||
          valAktif === "1" ||
          valAktif === "AKTIF" ||
          valAktif === "YA";
      
        return sameJenjang && sameKelas && sameParalel && isAktif;
      });
      
      // MTs → filter lokasi HANYA kalau kolom lokasi memang ada isinya
      if (jenjang === "MTs" && lokasi) {
        santri = santri.filter((s) => {
          if (s.lokasi == null || s.lokasi === "") return true; // kalau view belum punya lokasi, jangan disaring
          return s.lokasi === lokasi;
        });
      }
      
      // MA → filter jurusan HANYA kalau kolom jurusan ada
      if (jenjang === "MA" && jurusan) {
        santri = santri.filter((s) => {
          if (s.jurusan == null || s.jurusan === "") return true;
          return s.jurusan === jurusan;
        });
      }
      
      santri = santri.sort((a, b) => a.nama.localeCompare(b.nama));

      inputTableBody.innerHTML = "";

      if (!santri || santri.length === 0) {
        inputTableBody.innerHTML =
          '<tr><td colspan="3" style="text-align:center; padding:1rem;">Tidak ada santri untuk filter ini.</td></tr>';
        showToast("⚠️ tidak ada data.", "warning");
        return;
      }

      const santriIds = santri.map((s) => s.id);

      const { data: sakitData, error: errSakit } = await db
        .from("santri_sakit")
        .select("santri_id, alasan_sakit")
        .eq("tanggal", tanggal)
        .in("santri_id", santriIds);

      if (errSakit) {
        console.error("Gagal load santri_sakit:", errSakit);
        showToast("❎ gagal memuat data.", "error");
        return;
      }

      const mapSakit = new Map();
      (sakitData || []).forEach((row) => {
        mapSakit.set(row.santri_id, row.alasan_sakit || "");
      });

      santri.forEach((s, index) => {
        const tr = document.createElement("tr");

        const tdNo = document.createElement("td");
        tdNo.classList.add("col-no");
        tdNo.textContent = index + 1;

        const tdNama = document.createElement("td");
        tdNama.textContent = s.nama;

        const tdAlasan = document.createElement("td");
        const inp = document.createElement("input");
        inp.type = "text";
        inp.classList.add("alasan-input");
        inp.setAttribute("list", "alasanList");
        inp.value = mapSakit.get(s.id) || "";
        inp.dataset.santriId = s.id;
        tdAlasan.appendChild(inp);

        tr.appendChild(tdNo);
        tr.appendChild(tdNama);
        tr.appendChild(tdAlasan);

        inputTableBody.appendChild(tr);
      });

      showToast("✅ berhasil memuat data.", "info");

      switchInputPanel("daftar");
    } finally {
      setButtonLoading(btnLoadInput, false);
    }
  }

  async function saveInputData() {
    const tanggal = inputTanggal.value;
    if (!tanggal) {
      showToast("⚠️ pilih tanggal rekap.", "error");
      return;
    }

    const rows = inputTableBody.querySelectorAll("tr");
    if (!rows.length) {
      showToast("⚠️ tidak ada data.", "error");
      return;
    }

    setButtonLoading(
      btnSaveInput,
      true,
      '<span class="icon">⏳</span> Menyimpan...'
    );

    try {
      const santriIds = [];
      const payload = [];

      rows.forEach((row) => {
        const inp = row.querySelector(".alasan-input");
        if (!inp) return;
        const santriId = Number(inp.dataset.santriId);
        const alasan = inp.value.trim();
        if (!santriId) return;
        santriIds.push(santriId);
        if (alasan) {
          payload.push({
            tanggal,
            santri_id: santriId,
            alasan_sakit: alasan,
          });
        }
      });

      if (!santriIds.length) {
        showToastAuto("⚠️ tidak ada data santri.");
        return;
      }

      const { error: delErr } = await db
        .from("santri_sakit")
        .delete()
        .eq("tanggal", tanggal)
        .in("santri_id", santriIds);

      if (delErr) {
        console.error("Gagal hapus data sakit lama:", delErr);
        showToastAuto("❎ gagal menghapus data lama.");
        return;
      }

      if (payload.length) {
        const { error: insErr } = await db
          .from("santri_sakit")
          .insert(payload);

        if (insErr) {
          console.error("Gagal insert data sakit:", insErr);
          showToast("❎ gagal menyimpan data.", "error");
          return;
        }
      }

      showToast("✅ berhasil menyimpan data.", "info");
      switchInputPanel("filter");
      inputTableBody.innerHTML = "";
    } finally {
      setButtonLoading(btnSaveInput, false);
    }
  }

  // ===== REKAP HARIAN =====
  function masukModeEditAlasan(displayEl) {
    const currentVal = displayEl.dataset.value || "";
    const santriId = displayEl.dataset.santriId;

    if (displayEl.dataset.editing === "1") return;
    displayEl.dataset.editing = "1";

    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("alasan-input");
    input.setAttribute("list", "alasanList");
    input.value = currentVal;
    input.dataset.santriId = santriId;

    function selesaiEdit(save) {
      const newVal = save ? input.value.trim() : currentVal;
      const span = document.createElement("div");
      span.classList.add("alasan-display");
      span.dataset.santriId = santriId;
      span.dataset.value = newVal;

      if (!newVal) {
        span.textContent = "(kosong)";
        span.classList.add("empty");
      } else {
        span.textContent = newVal;
      }

      span.addEventListener("click", () => masukModeEditAlasan(span));
      input.replaceWith(span);
    }

    input.addEventListener("blur", () => selesaiEdit(true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        input.blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        selesaiEdit(false);
      }
    });

    displayEl.replaceWith(input);
    input.focus();
    input.select();
  }

  async function loadRekapTable(options = {}) {
    const { silent = false } = options;

    const tanggal = rekapTanggal.value;
    if (!tanggal) {
      showToast("⚠️ pilih tanggal rekap.", "error");
      return;
    }

    const { data: sakitData, error: errSakit } = await db
      .from("santri_sakit")
      .select("id, tanggal, santri_id, alasan_sakit")
      .eq("tanggal", tanggal)
      .order("id", { ascending: true });

    if (errSakit) {
      console.error("Gagal load rekap sakit:", errSakit);
      showToast("❎ gagal memuat rekap.", "error");
      return;
    }

    rekapTableBody.innerHTML = "";

    if (!sakitData || sakitData.length === 0) {
      rekapTableBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; padding:1rem;">Tidak ada data santri sakit pada tanggal ini.</td></tr>';
      if (!silent) {
        showToast("⚠️ tidak ada data.", "info");
      }
      return;
    }

    sakitData.forEach((row, index) => {
      const santri = santriMaster.find((s) => s.id === row.santri_id);
      const nama = santri ? santri.nama : "(santri tidak ditemukan)";
      const kelasLabel = santri
        ? `${santri.kelas} ${santri.jurusan} ${santri.paralel}`
        : "-";

      const tr = document.createElement("tr");

      const tdNo = document.createElement("td");
      tdNo.classList.add("col-no");
      tdNo.textContent = index + 1;

      const tdNama = document.createElement("td");
      tdNama.textContent = nama;

      const tdKelas = document.createElement("td");
      const spanKelas = document.createElement("span");
      spanKelas.classList.add("kelas-badge");
      spanKelas.textContent = kelasLabel;
      tdKelas.appendChild(spanKelas);

      const tdAlasan = document.createElement("td");
      const spanAlasan = document.createElement("div");
      spanAlasan.classList.add("alasan-display");
      spanAlasan.dataset.santriId = row.santri_id;
      spanAlasan.dataset.value = row.alasan_sakit || "";
      if (!row.alasan_sakit) {
        spanAlasan.textContent = "(kosong)";
        spanAlasan.classList.add("empty");
      } else {
        spanAlasan.textContent = row.alasan_sakit;
      }
      spanAlasan.addEventListener("click", () =>
        masukModeEditAlasan(spanAlasan)
      );
      tdAlasan.appendChild(spanAlasan);

      tr.appendChild(tdNo);
      tr.appendChild(tdNama);
      tr.appendChild(tdKelas);
      tr.appendChild(tdAlasan);

      rekapTableBody.appendChild(tr);
    });

    if (!silent) {
      showToast("✅ berhasil memuat rekap.", "info");
    }
  }

  async function saveRekapData() {
    const tanggal = rekapTanggal.value;
    if (!tanggal) {
      showToast("⚠️ pilih tanggal rekap.", "error");
      return;
    }

    if (document.activeElement && document.activeElement.tagName === "INPUT") {
      document.activeElement.blur();
    }

    const rows = rekapTableBody.querySelectorAll("tr");
    const payload = [];

    rows.forEach((row) => {
      const display = row.querySelector(".alasan-display");
      if (!display) return;
      const alasan = (display.dataset.value || "").trim();
      const santriId = Number(display.dataset.santriId);
      if (!santriId) return;
      if (alasan) {
        payload.push({
          tanggal,
          santri_id: santriId,
          alasan_sakit: alasan,
        });
      }
    });

    const { error: delErr } = await db
      .from("santri_sakit")
      .delete()
      .eq("tanggal", tanggal);

    if (delErr) {
      console.error("Gagal hapus data lama rekap:", delErr);
      showToast("❎ gagal menghapus data.", "error");
      return;
    }

    if (payload.length) {
      const { error: insErr } = await db
        .from("santri_sakit")
        .insert(payload);

      if (insErr) {
        console.error("Gagal insert rekap baru:", insErr);
        showToast("❎ gagal menyimpan revisi.", "error");
        return;
      }
    }

    showToast("✅ berhasil menyimpan data.", "info");
    await loadDistinctAlasanSakit();
    await loadRekapTable({ silent: true });
  }

  // ===== REKAP BULANAN =====
  async function loadRekapBulanan() {
    const bulanStr = rekapBulan.value;
    if (!bulanStr) {
      showToast("⚠️ pilih bulan rekap.", "error");
      return;
    }

    const range = getMonthRange(bulanStr);
    if (!range) {
      showToast("Format bulan tidak valid.", "error");
      return;
    }

    const { start, end } = range;

    const { data: sakitData, error } = await db
      .from("santri_sakit")
      .select("santri_id, alasan_sakit, tanggal")
      .gte("tanggal", start)
      .lte("tanggal", end);

    if (error) {
      console.error("Gagal load rekap bulanan:", error);
      showToast("❎ gagal memuat rekap.", "error");
      return;
    }

    monthlyChartContainer.innerHTML = "";

    if (!sakitData || sakitData.length === 0) {
      monthlyChartContainer.innerHTML =
        '<div style="text-align:center; padding:1rem; font-size:0.85rem; color:var(--gray);">Tidak ada data santri sakit pada bulan ini.</div>';
      showToast("Tidak ada data santri sakit pada bulan ini.", "info");
      return;
    }

    // Agregat per santri
    const bySantri = new Map();
    sakitData.forEach((row) => {
      const sid = row.santri_id;
      if (!sid) return;
      if (!bySantri.has(sid)) {
        bySantri.set(sid, {
          count: 0,
          dates: new Set(),
          reasons: new Map(),
        });
      }
      const obj = bySantri.get(sid);
      obj.count += 1;
      obj.dates.add(row.tanggal);

      const reason = (row.alasan_sakit || "").trim() || "tanpa keterangan";
      obj.reasons.set(reason, (obj.reasons.get(reason) || 0) + 1);
    });

    const entries = Array.from(bySantri.entries());
    if (!entries.length) {
      monthlyChartContainer.innerHTML =
        '<div style="text-align:center; padding:1rem; font-size:0.85rem; color:var(--gray);">Tidak ada data santri sakit pada bulan ini.</div>';
      showToast("Tidak ada data santri sakit pada bulan ini.", "info");
      return;
    }

    const totalCases = entries.reduce((sum, [, obj]) => sum + obj.count, 0);

    // 1) AGREGAT PER KELAS
    const byKelas = new Map();
    entries.forEach(([santriId, obj]) => {
      const santri = santriById.get(santriId);
      const kelasLabel = santri
        ? `${santri.kelas} ${santri.jurusan} ${santri.paralel}`
        : "(kelas tidak ditemukan)";

      if (!byKelas.has(kelasLabel)) {
        byKelas.set(kelasLabel, {
          count: 0,
          reasons: new Map(),
          santriCounts: new Map(),
        });
      }
      const k = byKelas.get(kelasLabel);
      k.count += obj.count;

      obj.reasons.forEach((n, reason) => {
        k.reasons.set(reason, (k.reasons.get(reason) || 0) + n);
      });

      if (santri) {
        const nama = santri.nama;
        k.santriCounts.set(nama, (k.santriCounts.get(nama) || 0) + obj.count);
      }
    });

    const kelasEntries = Array.from(byKelas.entries()).sort(
      (a, b) => b[1].count - a[1].count
    );

    // BOX DIAGRAM KELAS
    if (kelasEntries.length) {
      const kelasSection = document.createElement("div");
      kelasSection.classList.add("chart-section-card");

      const kelasTitle = document.createElement("div");
      kelasTitle.classList.add("chart-section-title");
      kelasTitle.textContent = "KELAS DENGAN FREKUENSI SAKIT TERBANYAK";

      const kelasSubtitle = document.createElement("div");
      kelasSubtitle.classList.add("chart-section-subtitle");
      kelasSubtitle.textContent =
        "Ringkasan total kasus dan daftar santri sakit per kelas dalam bulan ini.";

      kelasSection.appendChild(kelasTitle);
      kelasSection.appendChild(kelasSubtitle);

      kelasEntries.forEach(([kelasLabel, obj]) => {
        const percent = totalCases ? (obj.count / totalCases) * 100 : 0;
        const percentRoundedInt = Math.round(percent);

        const santriArr = Array.from(obj.santriCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        );
        const santriText = santriArr
          .map(([nama, n]) => `${nama} (${n}x)`)
          .join(", ");

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("chart-row");

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("chart-row-header");

        const leftSpan = document.createElement("div");
        leftSpan.classList.add("chart-row-name");
        leftSpan.textContent = kelasLabel;

        const rightSpan = document.createElement("div");
        rightSpan.classList.add("chart-row-meta");
        rightSpan.textContent = `${obj.count}x (${percentRoundedInt}%)`;

        headerDiv.appendChild(leftSpan);
        headerDiv.appendChild(rightSpan);

        const barTrack = document.createElement("div");
        barTrack.classList.add("chart-bar-track");
        const barFill = document.createElement("div");
        barFill.classList.add("chart-bar-fill");
        barFill.style.width = `${percent}%`;
        barTrack.appendChild(barFill);

        const printBar = document.createElement("div");
        printBar.classList.add("chart-row-printbar");
        const barUnits = 20;
        const filledUnits = Math.round((percent / 100) * barUnits);
        const emptyUnits = barUnits - filledUnits;
        const barString =
          "[" + "#".repeat(filledUnits) + " ".repeat(emptyUnits) + "]";
        printBar.textContent = `${barString} ${percent.toFixed(1)}%`;

        const reasonsDiv = document.createElement("div");
        reasonsDiv.classList.add("chart-row-reasons");
        reasonsDiv.innerHTML =
          `<strong>Rincian:</strong> ` +
          (santriText || `Total ${obj.count} kasus sakit di kelas ini.`);

        rowDiv.appendChild(headerDiv);
        rowDiv.appendChild(barTrack);
        rowDiv.appendChild(printBar);
        rowDiv.appendChild(reasonsDiv);

        kelasSection.appendChild(rowDiv);
      });

      monthlyChartContainer.appendChild(kelasSection);
    }

    // BOX DIAGRAM SANTRI
    entries.sort((a, b) => b[1].count - a[1].count);

    const santriSection = document.createElement("div");
    santriSection.classList.add("chart-section-card");

    const santriTitle = document.createElement("div");
    santriTitle.classList.add("chart-section-title");
    santriTitle.textContent = "SANTRI DENGAN FREKUENSI SAKIT TERBANYAK";

    const santriSubtitle = document.createElement("div");
    santriSubtitle.classList.add("chart-section-subtitle");
    santriSubtitle.textContent =
      "Detail per santri dengan rincian alasan sakit yang paling sering.";

    santriSection.appendChild(santriTitle);
    santriSection.appendChild(santriSubtitle);

    entries.forEach(([santriId, obj]) => {
      const santri = santriById.get(santriId);
      const nama = santri ? santri.nama : "(santri tidak ditemukan)";
      const kelasLabel = santri
        ? `${santri.kelas} ${santri.jurusan} ${santri.paralel}`
        : "-";

      const percent = totalCases ? (obj.count / totalCases) * 100 : 0;
      const percentRoundedInt = Math.round(percent);

      const reasonsArr = Array.from(obj.reasons.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      const reasonsText = reasonsArr
        .map(([reason, n]) => `${reason} (${n}x)`)
        .join(", ");

      const rowDiv = document.createElement("div");
      rowDiv.classList.add("chart-row");

      const headerDiv = document.createElement("div");
      headerDiv.classList.add("chart-row-header");

      const leftSpan = document.createElement("div");
      leftSpan.classList.add("chart-row-name");
      leftSpan.textContent = `${nama} (${kelasLabel})`;

      const rightSpan = document.createElement("div");
      rightSpan.classList.add("chart-row-meta");
      rightSpan.textContent = `${obj.count}x (${percentRoundedInt}%)`;

      headerDiv.appendChild(leftSpan);
      headerDiv.appendChild(rightSpan);

      const barTrack = document.createElement("div");
      barTrack.classList.add("chart-bar-track");
      const barFill = document.createElement("div");
      barFill.classList.add("chart-bar-fill");
      barFill.style.width = `${percent}%`;
      barTrack.appendChild(barFill);

      const printBar = document.createElement("div");
      printBar.classList.add("chart-row-printbar");
      const barUnits = 20;
      const filledUnits = Math.round((percent / 100) * barUnits);
      const emptyUnits = barUnits - filledUnits;
      const barString =
        "[" + "#".repeat(filledUnits) + " ".repeat(emptyUnits) + "]";
      printBar.textContent = `${barString} ${percent.toFixed(1)}%`;

      const reasonsDiv = document.createElement("div");
      reasonsDiv.classList.add("chart-row-reasons");
      reasonsDiv.innerHTML = `<strong>Rincian:</strong> ${reasonsText}`;

      rowDiv.appendChild(headerDiv);
      rowDiv.appendChild(barTrack);
      rowDiv.appendChild(printBar);
      rowDiv.appendChild(reasonsDiv);

      santriSection.appendChild(rowDiv);
    });

    monthlyChartContainer.appendChild(santriSection);

    // BOX DIAGRAM JENIS SAKIT
    const byReason = new Map();
    sakitData.forEach((row) => {
      const raw = (row.alasan_sakit || "").trim();
      const label = raw || "tanpa keterangan";
      if (!byReason.has(label)) {
        byReason.set(label, {
          count: 0,
          santriCounts: new Map(),
        });
      }
      const obj = byReason.get(label);
      obj.count += 1;

      const santri = santriMaster.find((s) => s.id === row.santri_id);
      if (santri) {
        const nama = santri.nama;
        obj.santriCounts.set(nama, (obj.santriCounts.get(nama) || 0) + 1);
      }
    });

    const reasonEntries = Array.from(byReason.entries()).sort(
      (a, b) => b[1].count - a[1].count
    );

    if (reasonEntries.length) {
      const reasonSection = document.createElement("div");
      reasonSection.classList.add("chart-section-card");

      const reasonTitle = document.createElement("div");
      reasonTitle.classList.add("chart-section-title");
      reasonTitle.textContent = "JENIS SAKIT YANG PALING SERING DIALAMI SANTRI";

      const reasonSubtitle = document.createElement("div");
      reasonSubtitle.classList.add("chart-section-subtitle");
      reasonSubtitle.textContent =
        "Perbandingan frekuensi setiap jenis sakit dalam bulan ini.";

      reasonSection.appendChild(reasonTitle);
      reasonSection.appendChild(reasonSubtitle);

      reasonEntries.forEach(([reasonLabel, obj]) => {
        const percent = totalCases ? (obj.count / totalCases) * 100 : 0;
        const percentRoundedInt = Math.round(percent);

        const santriArr = Array.from(obj.santriCounts.entries()).sort(
          (a, b) => b[1] - a[1]
        );
        const santriText = santriArr.map(([nama]) => nama).join(", ");

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("chart-row");

        const headerDiv = document.createElement("div");
        headerDiv.classList.add("chart-row-header");

        const leftSpan = document.createElement("div");
        leftSpan.classList.add("chart-row-name");
        leftSpan.textContent = reasonLabel;

        const rightSpan = document.createElement("div");
        rightSpan.classList.add("chart-row-meta");
        rightSpan.textContent = `${obj.count}x (${percentRoundedInt}%)`;

        headerDiv.appendChild(leftSpan);
        headerDiv.appendChild(rightSpan);

        const barTrack = document.createElement("div");
        barTrack.classList.add("chart-bar-track");
        const barFill = document.createElement("div");
        barFill.classList.add("chart-bar-fill");
        barFill.style.width = `${percent}%`;
        barTrack.appendChild(barFill);

        const printBar = document.createElement("div");
        printBar.classList.add("chart-row-printbar");
        const barUnits = 20;
        const filledUnits = Math.round((percent / 100) * barUnits);
        const emptyUnits = barUnits - filledUnits;
        const barString =
          "[" + "#".repeat(filledUnits) + " ".repeat(emptyUnits) + "]";
        printBar.textContent = `${barString} ${percent.toFixed(1)}%`;

        const reasonsDiv = document.createElement("div");
        reasonsDiv.classList.add("chart-row-reasons");
        reasonsDiv.innerHTML =
          `<strong>Rincian:</strong> ${
            santriText || "Nama santri tidak tersedia."
          }`;

        rowDiv.appendChild(headerDiv);
        rowDiv.appendChild(barTrack);
        rowDiv.appendChild(printBar);
        rowDiv.appendChild(reasonsDiv);

        reasonSection.appendChild(rowDiv);
      });

      monthlyChartContainer.appendChild(reasonSection);
    }

    // ===== TABEL PRINT =====
    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add("monthly-table-print");

    function buildTableSection(titleText, rowsData, labelHeader) {
      const sectionDiv = document.createElement("div");
      sectionDiv.style.marginBottom = "0.9rem";

      const titleEl = document.createElement("div");
      titleEl.classList.add("monthly-table-print-title");
      titleEl.textContent = titleText;

      const tableEl = document.createElement("table");
      tableEl.style.width = "100%";
      tableEl.style.borderCollapse = "collapse";

      const thead = document.createElement("thead");
      const trHead = document.createElement("tr");

      const headers = ["No", labelHeader, "Rincian", "Frekuensi"];
      headers.forEach((h) => {
        const th = document.createElement("th");
        th.textContent = h;
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      tableEl.appendChild(thead);

      const tbody = document.createElement("tbody");
      rowsData.forEach((row, idx) => {
        const tr = document.createElement("tr");

        const tdNo = document.createElement("td");
        tdNo.textContent = idx + 1;
        tdNo.style.textAlign = "center";

        const tdLabel = document.createElement("td");
        tdLabel.textContent = row.label;

        const tdDetail = document.createElement("td");
        tdDetail.textContent = row.detail;

        const tdFreq = document.createElement("td");
        tdFreq.textContent = row.count;
        tdFreq.style.textAlign = "center";

        tr.appendChild(tdNo);
        tr.appendChild(tdLabel);
        tr.appendChild(tdDetail);
        tr.appendChild(tdFreq);

        tbody.appendChild(tr);
      });

      tableEl.appendChild(tbody);

      sectionDiv.appendChild(titleEl);
      sectionDiv.appendChild(tableEl);
      return sectionDiv;
    }

    const kelasRows = kelasEntries.map(([kelasLabel, obj]) => {
      const santriArr = Array.from(obj.santriCounts.entries()).sort(
        (a, b) => b[1] - a[1]
      );

      const santriText = santriArr
        .map(([nama, n]) => `${nama} (${n}x)`)
        .join(", ");

      return {
        label: kelasLabel,
        detail: santriText || `Total ${obj.count} kasus sakit di kelas ini.`,
        count: obj.count,
      };
    });

    const santriRows = entries.map(([santriId, obj]) => {
    const santri = santriById.get(santriId);
      const nama = santri ? santri.nama : "(santri tidak ditemukan)";
      const kelasLabel = santri
        ? `${santri.kelas} ${santri.jurusan} ${santri.paralel}`
        : "-";

      const reasonsArr = Array.from(obj.reasons.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      const reasonsText = reasonsArr
        .map(([reason, n]) => `${reason} (${n}x)`)
        .join(", ");

      return {
        label: `${nama} (${kelasLabel})`,
        detail: reasonsText,
        count: obj.count,
      };
    });

    const reasonRows = reasonEntries.map(([reasonLabel, obj]) => {
      const santriArr = Array.from(obj.santriCounts.entries()).sort(
        (a, b) => b[1] - a[1]
      );
      const santriText = santriArr.map(([nama]) => nama).join(", ");

      return {
        label: reasonLabel,
        detail:
          santriText ||
          `Total ${obj.count} kasus untuk jenis sakit ini.`,
        count: obj.count,
      };
    });

    tableWrapper.appendChild(
      buildTableSection(
        "Kelas dengan frekuensi sakit terbanyak",
        kelasRows,
        "Kelas"
      )
    );
    tableWrapper.appendChild(
      buildTableSection(
        "Santri dengan frekuensi sakit terbanyak",
        santriRows,
        "Nama Santri"
      )
    );
    tableWrapper.appendChild(
      buildTableSection(
        "Jenis sakit yang paling sering diderita santri",
        reasonRows,
        "Jenis Sakit"
      )
    );

    monthlyChartContainer.appendChild(tableWrapper);

    showToast("✅ berhasil memuat rekap.", "info");
  }

  // ===== PWA INSTALL HANDLERS =====
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    if (installPromptContainer) {
      installPromptContainer.style.display = "flex";
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredPwaPrompt = null;
    if (installPromptContainer) {
      installPromptContainer.style.display = "none";
    }
    showToastAuto("✅ aplikasi berhasil diinstal.");
  });

  if (btnInstallApp) {
    btnInstallApp.addEventListener("click", async () => {
      if (!deferredPwaPrompt) {
        showToastAuto("ℹ️ Instalasi belum tersedia di perangkat ini.");
        return;
      }

      deferredPwaPrompt.prompt();
      const { outcome } = await deferredPwaPrompt.userChoice;

      if (outcome === "accepted") {
        showToastAuto("✅ permintaan instalasi dikonfirmasi.");
      } else {
        showToastAuto("ℹ️ instalasi dibatalkan.");
      }

      deferredPwaPrompt = null;
      if (installPromptContainer) {
        installPromptContainer.style.display = "none";
      }
    });
  }

  // ===== EVENT LISTENERS =====
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchTab(tab);

      if (tab === "input") {
        switchInputPanel("filter", { instant: true });
      }
    });
  });

  btnLoadInput.addEventListener("click", loadInputTable);
  btnSaveInput.addEventListener("click", saveInputData);

  btnLoadRekap.addEventListener("click", () => loadRekapTable());
  btnSaveRekap.addEventListener("click", saveRekapData);

  btnPrintRekap.addEventListener("click", () => {
    if (!rekapTanggal.value) {
      showToast("⚠️ pilih tanggal rekap.", "error");
      return;
    }
    switchTab("rekap-harian");
    window.print();
  });

  btnLoadRekapBulanan.addEventListener("click", loadRekapBulanan);

  btnPrintRekapBulanan.addEventListener("click", () => {
    if (!rekapBulan.value) {
      showToast("⚠️ pilih bulan rekap.", "error");
      return;
    }
    switchTab("rekap-bulanan");
    window.print();
  });

    window.addEventListener("load", async () => {
      setTodayToInputs();
      setThisMonthToRekapBulan();
      initChipGroups();
  
      const jenjangGroup = document.querySelector('.chip-group[data-target="inputJenjang"]');
      if (jenjangGroup) {
        jenjangGroup.querySelectorAll(".chip-option").forEach((btn) => {
          btn.addEventListener("click", applyJenjangLayout);
        });
      }
  
      // panggil saat awal load, supaya layout MTs/MA langsung sesuai
      window.requestAnimationFrame(() => {
        applyJenjangLayout();
      });
  
      await loadSantriMaster();
      await loadDistinctAlasanSakit();
      
      const savedTab = localStorage.getItem("sakit_active_tab");
      const allowedTabs = ["input", "rekap-harian", "rekap-bulanan"];
  
      if (savedTab && allowedTabs.includes(savedTab)) {
        switchTab(savedTab, { instant: true });
        if (savedTab === "input") {
          switchInputPanel("filter", { instant: true });
        }
      } else {
        switchTab("input", { instant: true });
        switchInputPanel("filter", { instant: true });
      }
  
      toastEnabled = true;
  
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./sw.js").catch(console.error);
      }
    });

})();
