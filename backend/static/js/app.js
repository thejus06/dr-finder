console.log("Script loaded");

async function findDoctors() {
    const symptoms = document.getElementById("symptoms").value.trim();
    const city = document.getElementById("city").value.trim().toLowerCase(); // ✅ MOVE HERE

    if (!symptoms) {
        alert("Please enter symptoms");
        return;
    }

    if (!city) {
        alert("Please enter city");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            console.log("GPS:", userLat, userLng);
            console.log("City:", city);

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
            if (!response.ok) {
                document.getElementById("result").innerHTML =
                    `<p class="error">${data.error}</p>`;
                return;
            }


            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = `<h3>${data.specialization}</h3>`;

            if (data.doctors.length === 0) {
                resultDiv.innerHTML += "<p>No doctors found in this city</p>";
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
        },
        (error) => {
            alert("Location access is required.");
            console.error(error);
        }
    );
}
