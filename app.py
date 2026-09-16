from flask import Flask, render_template, request, jsonify
import sqlite3

app = Flask(__name__)

DATABASE = "shesafe.db"


# ================= DATABASE =================

def init_db():

    conn = sqlite3.connect(DATABASE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


init_db()


# ================= HOME =================

@app.route("/")
def home():
    return render_template("index.html")


# ================= LOCATION PAGE =================

@app.route("/location-page")
def location_page():
    return render_template("location.html")


# ================= CONTACTS PAGE =================

@app.route("/contacts-page")
def contacts_page():
    return render_template("contacts.html")


# ================= SAVE CONTACT =================

@app.route("/save-contact", methods=["POST"])
def save_contact():

    data = request.get_json()

    name = data.get("name")
    phone = data.get("phone")

    if not name or not phone:

        return jsonify({
            "success": False,
            "message": "Please enter both name and phone number."
        })

    conn = sqlite3.connect(DATABASE)

    conn.execute(
        "INSERT INTO contacts (name, phone) VALUES (?, ?)",
        (name, phone)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Emergency contact saved successfully."
    })


# ================= GET CONTACTS =================

@app.route("/contacts")
def contacts():

    conn = sqlite3.connect(DATABASE)

    cursor = conn.execute(
        "SELECT id, name, phone FROM contacts"
    )

    contacts = []

    for row in cursor.fetchall():

        contacts.append({
            "id": row[0],
            "name": row[1],
            "phone": row[2]
        })

    conn.close()

    return jsonify(contacts)


# ================= DELETE CONTACT =================

@app.route("/delete-contact/<int:contact_id>",
           methods=["DELETE"])
def delete_contact(contact_id):

    conn = sqlite3.connect(DATABASE)

    conn.execute(
        "DELETE FROM contacts WHERE id = ?",
        (contact_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Contact deleted."
    })


# ================= LOCATION =================

@app.route("/location", methods=["POST"])
def location():

    data = request.get_json()

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    if latitude is None or longitude is None:

        return jsonify({
            "success": False,
            "message": "Location not received."
        })

    map_url = (
        "https://www.google.com/maps/search/?api=1"
        f"&query={latitude},{longitude}"
    )

    return jsonify({
        "success": True,
        "latitude": latitude,
        "longitude": longitude,
        "map_url": map_url
    })


# ================= SAFETY ASSISTANT =================

@app.route("/ask-ai", methods=["POST"])
def ask_ai():

    data = request.get_json()

    question = data.get("question", "").lower()

    if not question:

        return jsonify({
            "answer": "Please tell me what you need help with."
        })


    emergency_words = [
        "danger",
        "emergency",
        "attack",
        "following",
        "threat",
        "unsafe",
        "help",
        "someone is after me"
    ]


    if any(word in question for word in emergency_words):

        answer = """
If you are in immediate danger, move toward a public
or trusted place and contact emergency services.

In India, you can call 112 for emergency assistance.

Keep your phone accessible and share your location
with someone you trust.
"""


    elif "travel" in question or "alone" in question:

        answer = """
If you are travelling alone:

• Keep your phone charged.
• Tell a trusted person where you are going.
• Stay in well-lit and populated areas.
• Keep emergency contacts easily accessible.
• Move to a safer public place if something feels wrong.
"""


    elif "night" in question:

        answer = """
For travelling at night:

• Prefer well-lit and populated routes.
• Keep your phone charged.
• Inform a trusted person about your route.
• Avoid isolated areas when possible.
• Keep emergency services easily accessible.
"""


    elif "online" in question or "cyber" in question:

        answer = """
For online safety:

• Do not share passwords or sensitive information.
• Use strong and unique passwords.
• Avoid suspicious links.
• Block and report threatening accounts.
• Tell a trusted adult or authority about serious threats.
"""


    elif "harassment" in question:

        answer = """
If you are experiencing harassment:

• Move toward a safe public place.
• Tell someone you trust.
• Save relevant evidence if it is safe to do so.
• Use appropriate emergency or local support services.
"""


    else:

        answer = """
I can help with general safety guidance.

Try asking about:

• Emergency situations
• Travelling alone
• Night-time safety
• Online safety
• Harassment
"""


    return jsonify({
        "answer": answer
    })


# ================= RUN =================

if __name__ == "__main__":

    app.run(debug=True)