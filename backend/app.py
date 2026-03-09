from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import math
import sqlite3
from rapidfuzz import fuzz

# -------------------- Utility: Haversine Formula --------------------
def haversine(lat1, lon1, lat2, lon2):
    R = 6371
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

def init_db():
    conn = sqlite3.connect("appointments.db")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_name TEXT,
        doctor_name TEXT,
        date TEXT,
        time TEXT
    )
    """)

    conn.commit()
    conn.close()
# -------------------- Home Route --------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------- Find Doctors API --------------------
@app.route("/find-doctors", methods=["POST"])
def find_doctors():
    data = request.json

    raw_symptoms = data.get("symptoms", "").lower()
    district = data.get("district", "").lower()
    town = data.get("town", "").lower()
    user_lat = data.get("lat")
    user_lng = data.get("lng")

    #  Normalize symptoms (comma / and)
    matched_specializations = set()

    for symptom, specs in symptom_map.items():

        # direct phrase match
        if symptom in raw_symptoms:

            for spec in specs:
                matched_specializations.add(spec)

        # fallback fuzzy match
        else:
            similarity = fuzz.partial_ratio(raw_symptoms, symptom)

            if similarity > 80:
                for spec in specs:
                    matched_specializations.add(spec)

    #  No valid symptoms found
    if not matched_specializations:
        return jsonify({
            "error": "Symptoms not recognized. Please enter valid medical symptoms."
        }), 400

    #  Match doctors by specialization
    matched_doctors = [
        d for d in doctors
        if d["specialization"] in matched_specializations
    ]

    #  Filter by city
    if district:
        matched_doctors = [
            d for d in matched_doctors
            if district in d.get("city", "").lower()
        ]

    # Filter by town
    if town:
        matched_doctors = [
            d for d in matched_doctors
            if town in d.get("town", "").lower()
        ]

    #  Calculate distance
    for d in matched_doctors:
        d["distance_km"] = haversine(
            user_lat, user_lng, d["lat"], d["lng"]
        )

    #  Sort nearest first
    matched_doctors.sort(key=lambda x: x["distance_km"])

    return jsonify({
        "specialization": ", ".join(matched_specializations),
        "doctors": matched_doctors
    })


@app.route("/doctor/<int:id>")
def doctor_profile(id):

        doctor = None

        for d in doctors:
            if d["id"] == id:
                doctor = d
                break

        if not doctor:
            return "Doctor not found", 404

        return render_template("doctor.html", doctor=doctor)

@app.route("/book-appointment", methods=["POST"])
def book_appointment():

    data = request.form

    patient = data.get("patient_name")
    doctor = data.get("doctor_name")
    date = data.get("date")
    time = data.get("time")

    conn = sqlite3.connect("appointments.db")
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO appointments (patient_name, doctor_name, date, time)
        VALUES (?, ?, ?, ?)
    """, (patient, doctor, date, time))

    conn.commit()
    conn.close()

    return render_template("success.html", doctor=doctor, date=date, time=time)

# -------------------- Run Server --------------------
if __name__ == "__main__":
    init_db()
    app.run(debug=True)