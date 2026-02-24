# 🩺 Doctor Finder

Doctor Finder is a web application that helps users identify suitable doctors based on their symptoms and location.  
It also allows doctors to register, log in, and manage their profile on the platform.

---

## 🚀 Features

### 👤 User Features
- Enter symptoms and city
- Automatic symptom suggestions
- Doctor specialization matching
- Doctors filtered by city
- Distance calculation using GPS (Haversine formula)
- Doctor cards with contact and map

### 🧑‍⚕️ Doctor Features
- Doctor self-registration
- Username & password login
- Unique username validation
- Edit profile details
- Delete profile

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Python Flask
- **Data Storage:** JSON files
- **Maps:** Google Maps embed
- **Location:** Browser Geolocation API

---

## ⚙️ How It Works

1. User enters symptoms and city
2. Backend maps symptoms → medical specialization
3. Doctors are filtered by specialization and city
4. If GPS is available, distance is calculated
5. Results displayed as doctor cards with map

Doctors can also:
- Register an account
- Log in securely
- Update or delete their details

---

## ▶️ Run Locally

```bash
cd backend
pip install flask flask-cors
python app.py
Open browser:
http://127.0.0.1:5000