<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\CustomerProduct;
class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $customers = Customer::when($search, function ($query) use ($search) {
            $query->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
        })->paginate(10)->withQueryString();

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('customers/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|email|unique:customers,email',

            // Produk + Harga Custom
            'product_prices' => 'array|nullable',
            'product_prices.*.product_id' => 'exists:products,id',
            'product_prices.*.price_20ft' => 'numeric|nullable',
            'product_prices.*.price_40ft' => 'numeric|nullable',
            'product_prices.*.price_global' => 'numeric|nullable',
        ]);

        $customer = Customer::create([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'province' => $validated['province'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
        ]);

        if (!empty($validated['product_prices'])) {
            foreach ($validated['product_prices'] as $item) {
                $customer->products()->attach($item['product_id'], [
                    'custom_price_20ft' => $item['price_20ft'] ?? null,
                    'custom_price_40ft' => $item['price_40ft'] ?? null,
                    'custom_global_price' => $item['price_global'] ?? null,
                ]);
            }
        }

        return redirect()->route('customers.index')->with('success', 'Customer created successfully.');
    }

    public function edit(Customer $customer)
    {
        // Ambil semua produk (untuk pencarian)
        $products = Product::select('id', 'service_type as name')->get();

        // Ambil harga custom per produk untuk customer ini
        $productPrices = $customer->products()
            ->withPivot('custom_price_20ft', 'custom_price_40ft', 'custom_global_price')
            ->get()
            ->map(function ($product) {
                return [
                    'product_id' => $product->id,
                    'price_20ft' => $product->pivot->custom_price_20ft,
                    'price_40ft' => $product->pivot->custom_price_40ft,
                    'price_global' => $product->pivot->custom_global_price,
                ];
            });

        return Inertia::render('customers/edit', [
            'customer' => $customer,
            'products' => $products,
            'product_prices' => $productPrices,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string',
            'province' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => "nullable|email|unique:customers,email,{$customer->id}",

            // Produk + Harga Custom
            'product_prices' => 'array|nullable',
            'product_prices.*.product_id' => 'exists:products,id',
            'product_prices.*.price_20ft' => 'numeric|nullable',
            'product_prices.*.price_40ft' => 'numeric|nullable',
            'product_prices.*.price_global' => 'numeric|nullable',
        ]);

        $customer->update([
            'name' => $validated['name'],
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'province' => $validated['province'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'email' => $validated['email'] ?? null,
        ]);

        if (!empty($validated['product_prices'])) {
            // Kosongkan dulu lalu isi ulang
            $customer->products()->detach();

            foreach ($validated['product_prices'] as $item) {
                $customer->products()->attach($item['product_id'], [
                    'custom_price_20ft' => $item['price_20ft'] ?? null,
                    'custom_price_40ft' => $item['price_40ft'] ?? null,
                    'custom_global_price' => $item['price_global'] ?? null,
                ]);
            }
        }

        return redirect()->route('customers.index')->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return back()->with('success', 'Customer deleted successfully.');
    }

    // API: Produk milik customer tertentu
    public function productsForCustomer(Customer $customer)
    {
        // Ambil produk yang sudah di-assign ke customer (relasi many-to-many)
        $products = $customer->products()
            ->select('products.id', 'products.service_type', 'products.requires_temperature',
                'customer_product.custom_price_20ft', 'customer_product.custom_price_40ft', 'customer_product.custom_global_price'
            )
            ->get();

        return response()->json($products);
    }
}