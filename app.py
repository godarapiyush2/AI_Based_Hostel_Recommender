from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_mysqldb import MySQL
import re
import pandas as pd
import random
from io import BytesIO
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'Your_Password' 
app.config['MYSQL_DB'] = 'hostel_db' 
mysql = MySQL(app)

genai.configure(api_key="Your_API_KEY")
model = genai.GenerativeModel('gemini-pro')


def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

def get_availability_label():
    """Real-life sales tactic: Never show numbers. Always create urgency."""
    labels = [
        "Selling out fast! Limited spots.",
        "High demand: Only a few beds remaining.",
        "Highly sought after — almost full!",
        "Last chance: Very limited availability."
    ]
    return random.choice(labels)


@app.route('/api/start-chat', methods=['POST'])
def start_chat():
    cur = None
    try:
        data = request.json
        identifier = data.get('identifier', '')
        if not is_valid_email(identifier):
            return jsonify({"error": "invalid_email"}), 400

        cur = mysql.connection.cursor()
        cur.execute("SELECT id FROM users WHERE identifier = %s", (identifier,))
        user = cur.fetchone()
        
        if not user:
            cur.execute("INSERT INTO users (identifier) VALUES (%s)", (identifier,))
            mysql.connection.commit()
            user_id = cur.lastrowid
        else:
            user_id = user[0]
            
        return jsonify({"user_id": user_id})
    except Exception as e:
        return jsonify({"message": "Database error", "details": str(e)}), 500
    finally:
        if cur: cur.close()

@app.route('/api/get-recommendation', methods=['POST'])
def get_recommendation():
    cur = None 
    try:
        data = request.json
        cur = mysql.connection.cursor()
        
        raw_budget = str(data.get('budget', '16000')).replace('₹', '').replace(',', '').strip()
        user_budget = int(raw_budget) if raw_budget.isdigit() else 16000
        room_type = str(data.get('room_type', 'Girls')).strip()
        
        rejection_offset = int(data.get('rejection_count', 0))
        min_budget, max_budget = user_budget - 2500, user_budget + 2500
        
        query = """
            SELECT name, price, seats_available, specifications, image_url, rating, id
            FROM hostels 
            WHERE type = %s AND price BETWEEN %s AND %s AND seats_available > 0
            ORDER BY seats_available DESC, rating DESC 
            LIMIT 1 OFFSET %s
        """
        cur.execute(query, (room_type, min_budget, max_budget, rejection_offset))
        h = cur.fetchone()

        if not h:
            if rejection_offset > 0:
                return jsonify({
                    "is_card": False, 
                    "out_of_options": True, 
                    "message": "You've seen all our available inventory! Want to adjust your search?"
                })
            return jsonify({"is_card": False, "message": f"No {room_type} hostels found near ₹{user_budget}."})

        avail_msg = get_availability_label() 
        
        prompt = f"""
        You are an elite, highly persuasive leasing agent for HostelSafe. 
        Your ONLY goal is to confidently close the deal on: {h[0]} (₹{h[1]}/month). 
        Rules:
        1. State firmly this is the BEST match.
        2. Create FOMO and use assumptive closes.
        3. Do NOT mention exact seat numbers.
        4. Keep it to 2-3 punchy sentences.
        """
        
        try:
            response = model.generate_content(prompt)
            ai_message = response.text.strip()
        except:
            ai_message = f"This is hands-down the best match for you. {h[0]} is a premium property for ₹{h[1]}/month. Demand is peaking, so let's lock this in."

        res = {
            "is_card": True,
            "message": ai_message,
            "hostels": [{
                "name": h[0], "price": h[1], "avail_label": avail_msg, 
                "specs": h[3], "image": h[4], "rating": float(h[5]) if h[5] else 4.5, "id": h[6]
            }]
        }
        return jsonify(res)
    except Exception as e:
        return jsonify({"is_card": False, "message": "Server Error", "error": str(e)}), 500
    finally:
        if cur: cur.close()

@app.route('/api/public/hostels', methods=['GET'])
def get_public_hostels():
    cur = None
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, name, type, price, seats_available, rating, image_url, specifications FROM hostels")
        rows = cur.fetchall()
        
        hostels = [{
            "id": r[0], "name": r[1], "type": r[2], "price": r[3], 
            "seats": r[4], "rating": float(r[5]) if r[5] else 4.5, 
            "image": r[6], "specs": r[7]
        } for r in rows]
        
        return jsonify(hostels)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()


@app.route('/api/admin/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    """Fetches stats and enquiries sorted by LATEST first with hostel interest"""
    cur = None
    try:
        cur = mysql.connection.cursor()
        
        # 1. Get Summary Stats
        cur.execute("SELECT COUNT(*), SUM(seats_available) FROM hostels")
        stats = cur.fetchone()
        
        # 2. Get Leads: Sorted by created_at DESC (Newest at the top)
        cur.execute("""
            SELECT id, identifier, hostel_interest, visit_date, created_at 
            FROM users 
            ORDER BY created_at DESC
        """)
        leads_rows = cur.fetchall()
        
        leads = [{
            "id": l[0], 
            "email": l[1], 
            "hostel": l[2] if l[2] else "General Inquiry", 
            "visit_date": l[3] if l[3] else "No Date Set", 
            "created_at": str(l[4])
        } for l in leads_rows]
        
        # 3. Get All Hostels for Management Table
        cur.execute("""
            SELECT id, name, type, price, seats_available, rating, 
                   image_url, specifications, is_studio, has_kitchen, 
                   has_garden, has_balcony 
            FROM hostels
        """)
        h_rows = cur.fetchall()
        
        return jsonify({
            "total_hostels": stats[0] or 0,
            "total_seats": int(stats[1]) if stats[1] else 0,
            "total_leads": len(leads),
            "leads": leads,
            "hostels": [{
                "id": h[0], "name": h[1], "type": h[2], "price": h[3], "seats": h[4], 
                "rating": float(h[5]) if h[5] else 4.5, "image_url": h[6], "specifications": h[7],
                "is_studio": bool(h[8]), "has_kitchen": bool(h[9]), "has_garden": bool(h[10]), "has_balcony": bool(h[11])
            } for h in h_rows]
        })
    except Exception as e:
        print("DASHBOARD ERROR:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()

@app.route('/api/admin/hostels/add', methods=['POST'])
def add_hostel():
    cur = None
    try:
        data = request.json
        cur = mysql.connection.cursor()
        query = """
            INSERT INTO hostels 
            (name, type, price, seats_available, rating, image_url, specifications, is_studio, has_kitchen, has_garden, has_balcony) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cur.execute(query, (
            data.get('name', 'Unnamed Hostel'), data.get('type', 'Girls'),
            data.get('price', 15000), data.get('seats', 10), 4.5, 
            data.get('image_url', ''), data.get('specifications', ''), 
            1 if data.get('is_studio') else 0, 1 if data.get('has_kitchen') else 0,
            1 if data.get('has_garden') else 0, 1 if data.get('has_balcony') else 0
        )) 
        mysql.connection.commit()
        return jsonify({"message": "Hostel added successfully", "id": cur.lastrowid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()

@app.route('/api/admin/export-excel', methods=['GET'])
def export_excel():
    cur = None
    try:
        cur = mysql.connection.cursor()
        cur.execute("SELECT id, identifier, hostel_interest, visit_date, created_at FROM users ORDER BY created_at DESC")
        df = pd.DataFrame(cur.fetchall(), columns=['ID', 'Email', 'Hostel Interest', 'Visit Date', 'Created At'])
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        output.seek(0)
        
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', as_attachment=True, download_name='HostelSafe_Leads.xlsx')
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()

@app.route('/api/book-visit', methods=['POST'])
def book_visit():
    cur = None
    try:
        data = request.json
        cur = mysql.connection.cursor()
        
        # Pulling identifiers from keys sent by React
        user_email = data.get('email') or data.get('identifier')
        hostel = data.get('hostel_name')
        v_date = data.get('visit_date')

        if not user_email:
            return jsonify({"error": "User identifier missing"}), 400

        cur.execute("""
            UPDATE users 
            SET hostel_interest = %s, visit_date = %s 
            WHERE identifier = %s
        """, (hostel, v_date, user_email))
        
        mysql.connection.commit()
        
        if cur.rowcount == 0:
            return jsonify({"error": "User not found. Ensure the user exists before booking."}), 404

        return jsonify({"message": "Booking saved successfully"}), 200
    except Exception as e:
        print("BOOKING ERROR:", str(e))
        return jsonify({"error": str(e)}), 500
    finally:
        if cur: cur.close()

if __name__ == '__main__':
    app.run(port=5000, debug=True)