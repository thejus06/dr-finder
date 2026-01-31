console.log("Script loaded");

let userLat = null;
let userLng = null;
const button = document.querySelector("button");


async function findDoctors() {
    const symptoms = document.getElementById("symptoms").value.trim();
    const city = document.getElementById("city").value.trim().toLowerCase();

    const resultDiv = document.getElementById("result");
    const loading = document.getElementById("loading");
    const btn = document.getElementById("findBtn");

    if (!symptoms || !city) {
        resultDiv.innerHTML = `<div class="error">Please enter symptoms and city.</div>`;
        return;
    }

    
    btn.disabled = true;
    btn.innerText = "Searching...";
    loading.classList.remove("hidden");
    resultDiv.innerHTML = "";

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            try {
                const response = await fetch("/find-doctors", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        symptoms: symptoms,
                        city: city,
                        lat: userLat,
                        lng: userLng
                    })
                });

                const data = await response.json();
                loading.classList.add("hidden");

                if (!response.ok) {
                    resultDiv.innerHTML = `<div class="error">${data.error}</div>`;
                    return;
                }

                resultDiv.innerHTML = `
                    <div class="badge">${data.specialization}</div>
                `;


                if (data.doctors.length === 0) {
                    resultDiv.innerHTML += `
                        <div class="info">
                            No doctors found in this city
                        </div>
                    `;
                     return;
                }


                data.doctors.forEach(d => {
                    resultDiv.innerHTML += `
                        <div class="card">
                            <strong>${d.name}</strong><br>
                            ${d.hospital}<br>
                            📍 ${d.distance_km} km away<br>
                            📞 ${d.phone}
                        </div>
                    `;
                });

            } catch (err) {
                resultDiv.innerHTML = `<div class="error">Server error. Try again.</div>`;
            } finally {
                btn.disabled = false;
                btn.innerText = "Find Doctors";
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
