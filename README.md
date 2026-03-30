# 🏨 AI_Based_Hostel_Recommender

## 📌 Overview  
**AI_Based_Hostel_Recommender** is an intelligent hostel recommendation system that prioritizes **seat availability over perfect preference matching**.  

The goal is simple:  
👉 Help users find a hostel they can actually **get**, not just one that looks perfect.

---

## 🎯 Core Idea  

> 💡 *“Availability beats perfection.”*

This system ensures:
- Higher chances of booking  
- Practical recommendations  
- Real-world usability  

---

## ⚙️ Key Features  

### 🔹 Seat-First Recommendation Logic  
- Hostels ranked by **available seats (highest first)**  
- Ensures better chances of securing accommodation  

---

### 🔹 Budget Flexibility  
- Supports **₹2000–₹2500 buffer**  
- Example:
  - Budget: ₹10,000  
  - Range: ₹7,500 – ₹12,500  

---

### 🔹 Requirement Elasticity  
- Relaxes 1–2 non-critical preferences  
- Ensures user always gets options  

---

### 🔹 Strict Gender Filtering 🚫  
- Boys → Only boys hostels  
- Girls → Only girls hostels  
- No mixing (safety-first rule)  

---

## 🧠 Recommendation Logic  

```python
# 1. Filter by gender
hostels = [h for h in hostels if h.type == user_gender]

# 2. Apply budget buffer
min_price = budget - 2500
max_price = budget + 2500
hostels = [h for h in hostels if min_price <= h.price <= max_price]

# 3. Sort by seat availability (MAIN PRIORITY)
hostels.sort(key=lambda x: x.available_seats, reverse=True)

**🏗️ Tech Stack
**🔹 Backend
Python
Flask
MySQL
Google Gemini API
🔹 Frontend
React.js
Axios.

**Project Structure
**AI_Based_Hostel_Recommender/
│
├── backend/
├── frontend/
├── database/
├── README.md
└── requirements.txt

**Clone Repository
**git clone https://github.com/godarapiyush2/AI_Based_Hostel_Recommender.git
cd AI_Based_Hostel_Recommender

**Backend Setup
**cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

**Create a .env file:
**
GEMINI_API_KEY=your_api_key_here
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DB=hostel_db

Run Backend
python app.py

**Frontend Setup
**cd frontend
npm install
npm run dev

**Uses Google Gemini API:
**
import google.generativeai as genai

Unique Selling Point

✔ Seat-priority algorithm
✔ Practical recommendations
✔ Higher success rate in finding hostels

**📈 Future Improvements
**Real-time seat updates
Booking integration
User login system
Personalized recommendations
Map-based search
