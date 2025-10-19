from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
import os
import requests
from datetime import datetime
from urllib.parse import urlencode

app = Flask(__name__)
CORS(app, origins=["https://recycle-monitor-app.onrender.com", "http://localhost:5173"])

# Supabase REST API (NO PYTHON PACKAGE - BULLETPROOF!)
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')
SUPABASE_HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}


def supabase_request(method, endpoint, data=None):
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    response = requests.request(method, url, headers=SUPABASE_HEADERS, json=data)
    return response.json()


@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    hashed_pass = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode()
    employee_id = f"EMP-{int(datetime.now().timestamp()) % 10000:04d}"

    # Insert user
    user_data = {
        'email': data['email'],
        'employee_id': employee_id,
        'role': data['role'],
        'password_hash': hashed_pass,
        'name': data['name']
    }
    result = supabase_request('POST', 'users', user_data)

    return jsonify({'employee_id': employee_id}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.json
    result = supabase_request('GET', f'users?employee_id=eq.{data["employee_id"]}')

    if not result:
        return jsonify({'error': 'Invalid ID'}), 401

    user = result[0]
    if not bcrypt.checkpw(data['password'].encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Invalid password'}), 401

    profile = supabase_request('GET', f'user_profiles?user_id=eq.{user["id"]}')
    name = profile[0]['name'] if profile else user['name']

    return jsonify({
        'user': {**user, 'name': name},
        'role': user['role']
    }), 200


@app.route('/waste-entry', methods=['POST'])
def add_waste():
    data = request.json
    result = supabase_request('POST', 'waste_entries', data)
    return jsonify({'success': True, 'id': result[0]['id']}), 201


@app.route('/entries', methods=['GET'])
def get_entries():
    role = request.args.get('role')
    employee_id = request.args.get('employee_id')

    if role == 'admin':
        result = supabase_request('GET', 'waste_entries?order=created_at.desc')
    else:
        result = supabase_request('GET', f'waste_entries?employee_id=eq.{employee_id}')

    return jsonify(result), 200


@app.route('/approve', methods=['POST'])
def approve():
    data = request.json
    update_data = {
        'status': 'approved',
        'approved_by': data['admin_id']
    }
    result = supabase_request('PATCH', f'waste_entries? id=eq.{data["entry_id"]}', update_data)
    return jsonify({'success': True}), 200


@app.route('/deny', methods=['POST'])
def deny():
    data = request.json
    update_data = {
        'status': 'denied',
        'approved_by': data['admin_id']
    }
    result = supabase_request('PATCH', f'waste_entries?id=eq.{data["entry_id"]}', update_data)
    return jsonify({'success': True}), 200


if __name__ == '__main__':
    app.run(debug=True)