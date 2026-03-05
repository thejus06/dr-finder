console.log("Script loaded");

/* =========================
   THEME TOGGLE (DARK MODE)
========================= */
document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("theme-toggle");
    const thumb = themeToggle.querySelector(".toggle-thumb");
    const body = document.body;

    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark");
        thumb.textContent = "☀️";
    }

    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark");
        const isDark = body.classList.contains("dark");
        thumb.textContent = isDark ? "☀️" : "🌙";
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
});

/* =========================
   SYMPTOM AUTO-SUGGEST
========================= */
const symptomsInput = document.getElementById("symptoms");
const suggestionsBox = document.getElementById("suggestions");

const ALL_SYMPTOMS = [
    "fever",
    "cold",
    "cough",
    "headache",
    "chest pain",
    "skin",
    "eye",
    "tooth"
];

symptomsInput.addEventListener("input", () => {
    const value = symptomsInput.value.toLowerCase();
    const parts = value.split(/,|\band\b|\s+/);
    const lastWord = parts[parts.length - 1].trim();

    suggestionsBox.innerHTML = "";

    if (!lastWord) {
        suggestionsBox.classList.add("hidden");
        return;
    }

    const matches = ALL_SYMPTOMS.filter(sym =>
        sym.startsWith(lastWord)
    );

    if (!matches.length) {
        suggestionsBox.classList.add("hidden");
        return;
    }

    matches.forEach(symptom => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = symptom;

        div.onclick = () => {
            parts[parts.length - 1] = symptom;
            symptomsInput.value = parts.filter(Boolean).join(", ") + ", ";
            suggestionsBox.classList.add("hidden");
            symptomsInput.focus();
        };

        suggestionsBox.appendChild(div);
    });

    suggestionsBox.classList.remove("hidden");
});

document.addEventListener("click", (e) => {
    if (!symptomsInput.contains(e.target) &&
        !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add("hidden");
    }
});

/* =========================
   DOCTOR SEARCH LOGIC
========================= */
async function findDoctors() {
    const cityInput = document.getElementById("city");
    const resultDiv = document.getElementById("result");
    const loading = document.getElementById("loading");
    const btn = document.getElementById("findBtn");

    const symptoms = symptomsInput.value.trim();
    const city = cityInput.value.trim().toLowerCase();

    resultDiv.innerHTML = "";

    if (!symptoms || !city) {
        resultDiv.innerHTML = `<div class="error">Please enter both symptoms and city.</div>`;
        return;
    }

    // ✅ optional defensive check
    if (!navigator.geolocation) {
        resultDiv.innerHTML = `<div class="error">Geolocation not supported.</div>`;
        return;
    }

    btn.disabled = true;
    btn.innerText = "Searching...";
    loading.classList.remove("hidden");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const response = await fetch("/find-doctors", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        symptoms,
                        city,
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                });

                const data = await response.json();
                loading.classList.add("hidden");

                if (!response.ok) {
                    resultDiv.innerHTML = `<div class="error">${data.error}</div>`;
                    return;
                }

                resultDiv.innerHTML = `<div class="badge">${data.specialization}</div>`;

                if (!data.doctors.length) {
                    resultDiv.innerHTML += `<div class="info">No doctors found in this city.</div>`;
                    return;
                }

                data.doctors.forEach((d, i) => {
                    resultDiv.innerHTML += `
                        <div class="card" style="animation-delay:${i * 0.12}s">
                            <strong>${d.name}</strong><br>
                            <div class="specialization-badge">
                            🩺 ${d.specialization}
                            </div><br>
                            ${d.hospital}<br>
                            📍 ${d.distance_km} km away<br>
                            📞 ${d.phone}

                            <iframe
                                width="100%"
                                height="160"
                                style="margin-top:10px;border-radius:10px;border:0"
                                loading="lazy"
                                referrerpolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps?q=${d.lat},${d.lng}&output=embed">
                            </iframe>
                        </div>
                    `;
                });

            } catch {
                resultDiv.innerHTML = `<div class="error">Server error. Please try again.</div>`;
            } finally {
                btn.disabled = false;
                btn.innerText = "Find Doctors";
                loading.classList.add("hidden");
            }
        },
        () => {
            loading.classList.add("hidden");
            btn.disabled = false;
            btn.innerText = "Find Doctors";
            resultDiv.innerHTML = `<div class="error">Location access is required.</div>`;
        }
    );
}
