from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import math

# -------------------- Utility: Haversine Formula --------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in KM
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


# -------------------- App Setup --------------------
app = Flask(__name__)
CORS(app)

# -------------------- Load Data --------------------
with open("symptoms.json", "r") as f:
    symptom_map = json.load(f)

with open("doctors.json", "r") as f:
    doctors = json.load(f)


# -------------------- Home Route --------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------- Find Doctors API --------------------
@app.route("/find-doctors", methods=["POST"])
def find_doctors():
    data = request.json

    symptoms = data.get("symptoms", "").lower()
    city = data.get("city", "").lower()
    user_lat = data.get("lat")
    user_lng = data.get("lng")

    # 1️⃣ Detect specialization from symptoms
    specialization = None

    for key, value in symptom_map.items():
        if key in symptoms:
            specialization = value
            break

    # ❌ If no symptom matched
    if not specialization:
        return jsonify({
            "error": "Symptoms not recognized. Please enter valid medical symptoms."
        }), 400


    # 2️⃣ Match doctors by specialization
    matched_doctors = [
        d for d in doctors
        if d["specialization"].lower() == specialization.lower()
    ]

    print("City received from frontend:", city)

    # 3️⃣ Filter doctors by city (MAIN FIX)
    if city:
        matched_doctors = [
            d for d in matched_doctors
            if d.get("city", "").lower() == city
        ]

    # 4️⃣ Calculate distance using GPS
    for d in matched_doctors:
        d["distance_km"] = haversine(
            user_lat, user_lng, d["lat"], d["lng"]
        )

    # 5️⃣ Sort by nearest doctor
    matched_doctors.sort(key=lambda x: x["distance_km"])

    return jsonify({
        "specialization": specialization,
        "doctors": matched_doctors
    })


# -------------------- Run Server --------------------
if __name__ == "__main__":
    app.run(debug=True)
