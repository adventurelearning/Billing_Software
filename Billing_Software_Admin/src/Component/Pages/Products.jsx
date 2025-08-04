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
    <div className="container mx-auto px-2 py-2">
      <h1 className="text-2xl font-bold ">Product Management</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          <ProductForm 
            onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
            product={editingProduct}
            onCancel={() => setEditingProduct(null)}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Product List</h2>
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