import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Table, TableHead, TableBody, TableRow, TableCell, 
  Button, Badge, Dialog, Spinner
} from './ui-components';
import ProductForm from './ProductForm';
import ReorderForm from './ReorderForm';

export default function ProductTable({ showFilters = true }) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  // Fetch products data
  const { data: products = [], isLoading } = useQuery(
    'products',
    async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    }
  );

  // Delete product mutation
  const deleteProductMutation = useMutation(
    async (id) => {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return id;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
      },
    }
  );

  // Handlers
  const handleEditProduct = (product) => {
    setCurrentProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(id);
    }
  };

  const handleReorderClick = () => {
    const lowStock = products.filter(
      (product) => product.status === "low-stock" || product.status === "out-of-stock"
    );
    setLowStockProducts(lowStock);
    setIsReorderDialogOpen(true);
  };

  // Filter products
  const filteredProducts = products
    .filter(product => {
      // Search by name, sku, or description
      return (
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.description &&
            product.description.toLowerCase().includes(searchTerm.toLowerCase()))) &&
        // Filter by category
        (categoryFilter === '' || product.category === categoryFilter) &&
        // Filter by status
        (statusFilter === '' || product.status === statusFilter)
      );
    })
    .sort((a, b) => {
      // Sort by status priority: out-of-stock > low-stock > in-stock
      const statusPriority = {
        'out-of-stock': 0,
        'low-stock': 1,
        'in-stock': 2
      };
      return statusPriority[a.status] - statusPriority[b.status];
    });

  // Extract unique categories for filter
  const categories = [...new Set(products.map(product => product.category))];

  // Loading state
  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <div className="flex flex-col md:flex-row gap-2 md:gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select"
            >
              <option value="">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => { setCurrentProduct(null); setIsEditDialogOpen(true); }}>
              Add Product
            </Button>
            <Button 
              variant="secondary"
              onClick={handleReorderClick}
              disabled={!products.some(p => p.status === "low-stock" || p.status === "out-of-stock")}
            >
              Reorder
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Cost Price</TableCell>
              <TableCell>Selling Price</TableCell>
              <TableCell>Profit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell className="rupee-symbol">
                  {Number(product.costPrice).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="rupee-symbol">
                  {Number(product.sellingPrice).toLocaleString('en-IN')}
                </TableCell>
                <TableCell className={product.profit >= 0 ? "text-profit rupee-symbol" : "text-loss rupee-symbol"}>
                  {product.profit >= 0 ? product.profit.toLocaleString('en-IN') : 
                   `-${Math.abs(product.profit).toLocaleString('en-IN')}`}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      product.status === "in-stock"
                        ? "success"
                        : product.status === "low-stock"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {product.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleEditProduct(product)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(product.id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Product Dialog */}
      <Dialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        title={currentProduct ? "Edit Product" : "Add Product"}
      >
        <ProductForm 
          product={currentProduct} 
          onClose={() => setIsEditDialogOpen(false)} 
        />
      </Dialog>

      {/* Reorder Dialog */}
      <Dialog
        isOpen={isReorderDialogOpen}
        onClose={() => setIsReorderDialogOpen(false)}
        title="Reorder Low Stock Items"
      >
        <ReorderForm 
          products={lowStockProducts} 
          onClose={() => setIsReorderDialogOpen(false)} 
        />
      </Dialog>
    </div>
  );
}
