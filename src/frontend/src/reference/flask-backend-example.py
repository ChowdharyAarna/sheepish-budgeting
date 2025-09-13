# Extended Flask backend for Budget Tracker
# Based on your existing main.py pattern but adapted for budget tracking

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# In-memory storage (in production, use a proper database)
budget_data = {
    "transactions": [],
    "budgets": [],
    "totalBudget": 0,
    "totalSpent": 0,
    "categories": ['Food', 'Transportation', 'Entertainment', 'Utilities', 'Shopping', 'Healthcare']
}

@app.route('/api/update-budget', methods=['POST'])
def update_budget():
    """Update budget state - similar to your existing update-state endpoint"""
    data = request.get_json()
    current_state = data.get("state", {})
    
    # Update the budget data based on the incoming state
    if 'transactions' in current_state:
        budget_data['transactions'] = current_state['transactions']
    
    if 'totalSpent' in current_state:
        budget_data['totalSpent'] = current_state['totalSpent']
    
    if 'totalBudget' in current_state:
        budget_data['totalBudget'] = current_state['totalBudget']
    
    # Calculate spending by category
    category_spending = {}
    for transaction in budget_data['transactions']:
        category = transaction.get('category', 'Other')
        amount = transaction.get('amount', 0)
        category_spending[category] = category_spending.get(category, 0) + amount
    
    # Update budgets based on spending
    updated_budgets = []
    for category in budget_data['categories']:
        spent = category_spending.get(category, 0)
        # You can set budget limits here or receive them from frontend
        limit = 500  # Default limit per category
        updated_budgets.append({
            'category': category,
            'spent': spent,
            'limit': limit
        })
    
    budget_data['budgets'] = updated_budgets
    
    print(f"Updated budget data: {budget_data}")
    
    return jsonify(budget_data)

@app.route('/api/upload-receipt', methods=['POST'])
def upload_receipt():
    """Handle receipt image upload"""
    if 'receipt' not in request.files:
        return jsonify({'error': 'No receipt file provided'}), 400
    
    file = request.files['receipt']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file:
        # Save the file (in production, use cloud storage)
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S_')
        filename = timestamp + filename
        
        upload_folder = 'uploads/receipts'
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Get transaction data
        transaction_data = json.loads(request.form.get('transaction_data', '{}'))
        
        # Here you could integrate with OCR services to extract data from receipt
        # For now, we'll just return the file path
        
        return jsonify({
            'message': 'Receipt uploaded successfully',
            'filename': filename,
            'file_path': file_path,
            'transaction_data': transaction_data
        })

@app.route('/api/get-budget-data', methods=['GET'])
def get_budget_data():
    """Get current budget data"""
    return jsonify(budget_data)

if __name__ == "__main__":
    app.run(debug=True, port=7000)