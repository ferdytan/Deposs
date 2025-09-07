import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import CustomersLayout from '@/layouts/customers/layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// -----------------------------
// Types
// -----------------------------
type Product = {
    id: number;
    name: string;
};

type ProductPrice = {
    product_id: number;
    price_20ft: string;
    price_40ft: string;
    // price_global dihapus
};

interface PageProps {
    // Properti spesifik kamu
    product_prices: ProductPrice[];
    products: Product[];
    customer: {
        id: number;
        name: string;
        address: string | null;
        city: string | null;
        province: string | null;
        phone: string | null;
        email: string | null;
    };

    // ✅ Tambahkan index signature
    [key: string]: unknown;
}

export default function EditCustomer() {
    const { customer, products, product_prices } = usePage<PageProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        address: customer.address ?? '',
        city: customer.city ?? '',
        province: customer.province ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        product_prices: product_prices ?? [],
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>(product_prices.map((p) => p.product_id));

    const fetchProducts = async (keyword: string) => {
        try {
            const res = await fetch(route('products.search', { search: keyword }));
            const result = await res.json();
            setAvailableProducts(result);
        } catch (error) {
            console.error('Gagal mengambil produk:', error);
        }
    };

    useEffect(() => {
        fetchProducts('');
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const handleAddProduct = (product: Product) => {
        if (selectedProducts.includes(product.id)) return;
        setSelectedProducts([...selectedProducts, product.id]);
        setData('product_prices', [
            ...data.product_prices,
            {
                product_id: product.id,
                price_20ft: '',
                price_40ft: '',
                // price_global tidak ditambahkan
            },
        ]);
    };

    const handleRemoveProduct = (productId: number) => {
        if (!confirm('Yakin ingin menghapus produk ini dari daftar harga custom?')) return;
        setSelectedProducts(selectedProducts.filter((id) => id !== productId));
        setData(
            'product_prices',
            data.product_prices.filter((item) => item.product_id !== productId),
        );
    };

    const handlePriceChange = (index: number, field: 'price_20ft' | 'price_40ft', value: string) => {
        const updated = [...data.product_prices];
        updated[index][field] = value;
        setData('product_prices', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('customers.update', customer.id));
    };

    function formatNumber(value: string | number): string {
        if (!value) return '';
        const num = typeof value === 'number' ? value : parseInt(value.replace(/\D/g, ''), 10);
        if (isNaN(num)) return '';
        return num.toLocaleString('id-ID');
    }

    function parseNumber(value: string): string {
        return value.replace(/\D/g, '');
    }

    return (
        <AppLayout>
            <Head title={`Edit ${customer.name}`} />
            <CustomersLayout>
                <div className="max-w-3xl space-y-6 p-4 sm:p-6">
                    <HeadingSmall
                        title={`Edit Customer: ${customer.name}`}
                        description="Hanya 20' dan 40' yang digunakan. Harga global tidak digunakan."
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Nama & Email */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Customer Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="PT. Sejuta Rasa"
                                    required
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={data.email ?? ''}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="order@tigarasa.com"
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={data.address ?? ''}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Jl. Kalianak Utara"
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        {/* City & Province */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={data.city ?? ''}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="Surabaya"
                                />
                                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="province">Province</Label>
                                <Input
                                    id="province"
                                    name="province"
                                    value={data.province ?? ''}
                                    onChange={(e) => setData('province', e.target.value)}
                                    placeholder="East Java"
                                />
                                {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={data.phone ?? ''}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="628122224445"
                                />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Custom Pricing */}
                        <div className="space-y-4 rounded-md border border-gray-200 bg-white p-4">
                            <h3 className="font-medium text-gray-800">Custom Container Pricing (20' & 40')</h3>
                            <p className="text-sm text-gray-500">Hanya 20' dan 40' yang digunakan. Harga global dihapus.</p>

                            {/* Search */}
                            <div className="space-y-2">
                                <Label htmlFor="product-search">Search Products</Label>
                                <Input
                                    id="product-search"
                                    placeholder="Cari produk..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Daftar Produk */}
                            <div className="mt-2 max-h-40 overflow-y-auto rounded border">
                                {availableProducts.length > 0 ? (
                                    availableProducts.map((product) => {
                                        const isAdded = selectedProducts.includes(product.id);
                                        return (
                                            <div key={product.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50">
                                                <span className="text-sm">{product.name}</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={isAdded ? 'destructive' : 'default'}
                                                    onClick={() => (isAdded ? handleRemoveProduct(product.id) : handleAddProduct(product))}
                                                >
                                                    {isAdded ? 'Remove' : 'Add'}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="px-3 py-2 text-sm text-gray-500">No products found.</div>
                                )}
                            </div>

                            {/* Tabel */}
                            {data.product_prices.length > 0 && (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">20'</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">40'</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.product_prices.map((item, index) => (
                                                <tr key={item.product_id}>
                                                    <td className="px-4 py-2 text-sm whitespace-nowrap text-gray-800">
                                                        {products.find((p) => p.id === item.product_id)?.name || `Product ID ${item.product_id}`}
                                                    </td>
                                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={formatNumber(item.price_20ft)}
                                                            onChange={(e) => handlePriceChange(index, 'price_20ft', parseNumber(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full text-right"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={formatNumber(item.price_40ft)}
                                                            onChange={(e) => handlePriceChange(index, 'price_40ft', parseNumber(e.target.value))}
                                                            placeholder="0"
                                                            className="w-full text-right"
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">
                            {processing && <span className="mr-2 animate-spin">●</span>}
                            Update Customer
                        </Button>
                    </form>
                </div>
            </CustomersLayout>
        </AppLayout>
    );
}
