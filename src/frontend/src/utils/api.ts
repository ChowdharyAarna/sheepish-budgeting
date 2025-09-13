// API utilities for communicating with Flask backend
// Based on the pattern from your existing App.js and main.py files

export interface BudgetApiResponse {
  transactions: Array<{
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string;
    type: 'expense' | 'income';
    receipt?: string;
  }>;
  budgets: Array<{
    category: string;
    limit: number;
    spent: number;
  }>;
  totalBudget: number;
  totalSpent: number;
  categories: string[];
}

export const sendBudgetStateToServer = async (state: any): Promise<BudgetApiResponse> => {
  try {
    console.log('Sending budget state to server:', state);
    
    const response = await fetch('/api/update-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        state: state
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from server:', data);
    
    return data;
  } catch (error) {
    console.error('Error communicating with server:', error);
    throw error;
  }
};

// For receipt image upload
export const uploadReceiptToServer = async (imageFile: File, transactionData: any) => {
  try {
    const formData = new FormData();
    formData.append('receipt', imageFile);
    formData.append('transaction_data', JSON.stringify(transactionData));

    const response = await fetch('/api/upload-receipt', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
};