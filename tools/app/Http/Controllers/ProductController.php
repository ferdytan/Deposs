<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductController extends Controller
{
    // Menampilkan daftar produk dengan pencarian
    public function index(Request $request)
    {
        $query = Product::query();

        // Search (jika ada)
        if ($request->filled('search')) {
            $query->where('service_type', 'like', '%' . $request->search . '%');
        }

        // Sorting
        $allowedSorts = ['service_type', 'requires_temperature', 'description'];
        if ($request->filled('sort_by')) {
            $sortBy = in_array($request->sort_by, $allowedSorts) ? $request->sort_by : 'service_type';
            $sortDir = $request->input('sort_dir', 'asc');
            $query->orderBy($sortBy, $sortDir);
        }

        // Pagination
        $products = $query->paginate(10)->withQueryString();

        // Kirim ke Inertia
        return inertia('products/index', [
            'products' => $products,
            'filters' => $request->only(['search', 'sort_by', 'sort_dir']),
        ]);
    }


    // Mencari produk untuk autocomplete
    public function search(Request $request)
    {
        $query = $request->input('search');

        $products = Product::when($query, function ($q) use ($query) {
            $q->where('service_type', 'like', "%$query%");
        })->get(['id', 'service_type as name']);

        return response()->json($products);
    }

    // Menampilkan form tambah produk
    public function create()
    {
        return Inertia::render('products/create');
    }

    // File: ProductController.php

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requires_temperature' => 'required|in:0,1', // Terima 0 dan 1
        ]);

        Product::create([
            'service_type' => $validated['service_type'],
            'description' => $validated['description'] ?? null,
            'requires_temperature' => $validated['requires_temperature'], // Gunakan langsung nilai validasi
        ]);

        return redirect()->route('products.index')->with('success', 'Product created successfully.');
    }
    
    // Menampilkan form edit produk
    public function edit(Product $product)
    {
        return Inertia::render('products/edit', ['product' => $product]);
    }

    // Memperbarui produk
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'service_type' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requires_temperature' => 'required|in:0,1', // Pastikan selalu divalidasi
        ]);

        $product->update([
            'service_type' => $validated['service_type'],
            'description' => $validated['description'] ?? null,
            'requires_temperature' => $validated['requires_temperature'],
        ]);

        return redirect()->route('products.index')->with('success', 'Product updated successfully.');
    }

    // Menghapus produk
    public function destroy(Product $product)
    {
        $product->delete();
        return back()->with('success', 'Product deleted successfully.');
    }
}