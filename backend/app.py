from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import math

# ------------------ Distance Formula (Haversine) ------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + \
        math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * \
        math.sin(dlon / 2) ** 2

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

# ------------------ App Setup ------------------
app = Flask(__name__)
CORS(app)

# ------------------ Load Data ------------------
with open("symptoms.json") as f:
    symptom_map = json.load(f)

with open("doctors.json") as f:
    doctors = json.load(f)

# ------------------ Home Page ------------------
@app.route("/")
def home():
    return render_template("index.html")

# ------------------ Find Doctors API ------------------
@app.route("/find-doctors", methods=["POST"])
def find_doctors():
    data = request.json

    symptoms = data.get("symptoms", "").lower()
    user_lat = data.get("lat")
    user_lng = data.get("lng")

    # Decide specialization based on symptoms
    specialization = "General Physician"
    for key in symptom_map:
        if key in symptoms:
            specialization = symptom_map[key]
            break

    # Filter doctors by specialization and valid location
    matched_doctors = [
        d for d in doctors
        if d.get("specialization") == specialization
        and "lat" in d and "lng" in d
    ]

    # Calculate distance
    for d in matched_doctors:
        d["distance_km"] = haversine(
            user_lat, user_lng, d["lat"], d["lng"]
        )

    # Sort by nearest
    matched_doctors.sort(key=lambda x: x["distance_km"])

    return jsonify({
        "specialization": specialization,
        "doctors": matched_doctors
    })

# ------------------ Run Server ------------------
if __name__ == "__main__":
    app.run(debug=True)
