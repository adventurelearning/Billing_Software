import React, { useState, useEffect } from 'react';
import api from '../../service/api';


const Expenditure = () => {
  const [expenses, setExpenses] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [dateToView, setDateToView] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);



  // Load expenses from backend on component mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter expenses when dateToView changes
  useEffect(() => {
    if (dateToView) {
      fetchExpensesByDate(dateToView);
    } else {
      setFilteredExpenses([]);
      setTotalAmount(0);
    }
  }, [dateToView]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/expenses');
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      alert('Failed to fetch expenses');
      setLoading(false);
    }
  };

  const fetchExpensesByDate = async (date) => {
    try {
      setLoading(true);
      const response = await api.get(`/expenses/date/${date}`);
      setFilteredExpenses(response.data);
      
      // Calculate total amount for the selected date
      const total = response.data.reduce((sum, expense) => sum + expense.amount, 0);
      setTotalAmount(total);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses by date:', error);
      alert('Failed to fetch expenses for this date');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate || !amount || !description) {
      alert('Please fill all fields');
      return;
    }

    try {
      const newExpense = {
        date: selectedDate,
        amount: parseFloat(amount),
        description: description
      };

      const response = await api.post('/expenses', newExpense);
      
      // Update state with the new expense
      setExpenses([...expenses, response.data]);
      
      // If we're currently viewing the date of the new expense, update that view too
      if (dateToView === selectedDate) {
        setFilteredExpenses([...filteredExpenses, response.data]);
        setTotalAmount(totalAmount + parseFloat(amount));
      }
      
      // Reset form
      setSelectedDate('');
      setAmount('');
      setDescription('');
      
      alert('Expense added successfully!');
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await api.delete(`/expenses/${id}`);
      
      // Remove from all expenses
      const updatedExpenses = expenses.filter(expense => expense._id !== id);
      setExpenses(updatedExpenses);
      
      // If we're viewing expenses for a specific date, update the filtered list
      if (dateToView) {
        const filtered = filteredExpenses.filter(expense => expense._id !== id);
        setFilteredExpenses(filtered);
        
        const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);
      }
      
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">Personal Expense</h1>
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Add New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="What did you spend on?"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </button>
        </form>

        {/* View Expenses by Date */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">View Expenses by Date</h2>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
              <input
                type="date"
                value={dateToView}
                onChange={(e) => setDateToView(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setDateToView('')}
              className="mt-4 md:mt-6 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition duration-200"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Display Expenses for Selected Date */}
        {dateToView && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Expenses for {formatDate(dateToView)}
            </h2>
            
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading expenses...</p>
            ) : filteredExpenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses found for this date.</p>
            ) : (
              <>
                <div className="bg-blue-100 p-4 rounded-lg mb-4">
                  <p className="text-lg font-semibold text-blue-800">
                    Total for {formatDate(dateToView)}: ₹{totalAmount.toFixed(2)}
                  </p>
                </div>
                
                <div className="space-y-4">
                  {filteredExpenses.map((expense) => (
                    <div key={expense._id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-lg">₹{expense.amount.toFixed(2)}</p>
                        <p className="text-gray-600">{expense.description}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition duration-200"
                        aria-label="Delete expense"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* All Expenses Summary */}
        {!dateToView && (
          <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Expenses</h2>
            
            {loading ? (
              <p className="text-gray-500 text-center py-4">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No expenses recorded yet. Add your first expense above!</p>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense._id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{formatDate(expense.date)}</p>
                      <p className="text-lg font-bold text-blue-700">₹{expense.amount.toFixed(2)}</p>
                      <p className="text-gray-600">{expense.description}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      className="bg-red-100 text-red-600 p-2 rounded-full hover:bg-red-200 transition duration-200"
                      aria-label="Delete expense"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenditure;