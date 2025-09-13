from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

@app.route('/api/update-state', methods = ['POST'])
def update_state():
    data = request.get_json()
    current_state = data.get("state", {})

    sample_transaction = {
        "name": "Costco",
        "amount": 20.5,
        "date": "2025-09-14",
        "category": "Food & Dining",
      }
    
    current_state["transactions"].append(sample_transaction)
    current_state["receipt"] = ""



    


    
    # updated_state = {
    #     "test_num" : current_state.get("test_num") + 1, 
    #     "name": current_state.get("user"), 
    #     "button_pressed" : 0, 
    #     "sum_of_pressed" : current_state.get("sum_of_pressed") + current_state.get("button_pressed")}

    return jsonify(current_state)

if __name__ == "__main__":
    app.run(debug=True, port=5050, host="0.0.0.0")