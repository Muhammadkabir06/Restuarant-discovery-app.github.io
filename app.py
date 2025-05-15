from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# In-memory storage (replace with database in production)
favorites_db = {}
reservations_db = {}

@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    user_id = request.args.get('user_id', default='default_user')
    
    if request.method == 'POST':
        data = request.json
        if user_id not in favorites_db:
            favorites_db[user_id] = []
        
        if data['action'] == 'add':
            if data['restaurant'] not in favorites_db[user_id]:
                favorites_db[user_id].append(data['restaurant'])
        elif data['action'] == 'remove':
            if data['restaurant'] in favorites_db[user_id]:
                favorites_db[user_id].remove(data['restaurant'])
        
        return jsonify({'success': True, 'favorites': favorites_db[user_id]})
    
    return jsonify({'favorites': favorites_db.get(user_id, [])})

@app.route('/api/reservations', methods=['GET', 'POST'])
def handle_reservations():
    user_id = request.args.get('user_id', default='default_user')
    
    if request.method == 'POST':
        data = request.json
        if user_id not in reservations_db:
            reservations_db[user_id] = []
        
        if data['action'] == 'add':
            reservations_db[user_id].append(data['reservation'])
        elif data['action'] == 'remove':
            reservations_db[user_id] = [r for r in reservations_db[user_id] if r['id'] != data['reservation_id']]
        
        return jsonify({'success': True, 'reservations': reservations_db[user_id]})
    
    return jsonify({'reservations': reservations_db.get(user_id, [])})

if __name__ == '__main__':
    app.run(debug=True)