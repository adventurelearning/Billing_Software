// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import ProductForm from '../ProductForm';
import ProductTable from '../ProductTable';
import api from '../../service/api';


const Products = () => {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    // Load products from JSON file using Axios
    const loadProducts = async () => {
      try {
        const response = await api.get('/data/products.json');
        setProducts(response.data.products);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error loading products:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
      }
    };

    loadProducts();
  }, []);

  const handleAddProduct = (newProduct) => {
    const id = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
    const updatedProducts = [...products, { ...newProduct, id }];
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updatedProducts = products.map(p =>
      p.id === updatedProduct.id ? updatedProduct : p
    );
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const saveProducts = (productsToSave) => {
    // In a real app, you would save to a backend API
    // For this example, we'll just update the state
    console.log('Products would be saved here:', productsToSave);
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex justify-between items-center h-16">
            {/* Dashboard title */}
            <h1 className="text-lg md:text-xl font-semibold text-gray-700  whitespace-nowrap bg-blue-100 p-2 rounded-md">Product Management</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white p-3 rounded-lg shadow-md">
          <h2 className="text-base font-semibold mb-2">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <ProductForm
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            product={editingProduct}
            onCancel={() => setEditingProduct(null)}
          />
        </div>

        <div className="bg-white p-3 rounded-lg shadow-md">
          <h2 className="text-base font-semibold mb-4">Product List</h2>
          <ProductTable
            products={products}
            onEdit={setEditingProduct}
            onDelete={handleDeleteProduct}
          />
        </div>
      </div>
    </div>


  );
};

export default Products;