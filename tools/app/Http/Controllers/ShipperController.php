<?php

namespace App\Http\Controllers;

use App\Models\Shipper;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShipperController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $shippers = Shipper::when($search, function ($query) use ($search) {
            $query->where('name', 'like', "%$search%")
                  ->orWhere('email', 'like', "%$search%");
        })->paginate(10)->withQueryString();

        return Inertia::render('shippers/index', [
            'shippers' => $shippers,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        return Inertia::render('shippers/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'address'  => 'nullable|string',      // ✅ diubah: boleh kosong
            'city'     => 'nullable|string',
            'province' => 'nullable|string',
            'phone'    => 'nullable|string',
            'email'    => 'nullable|email|unique:shippers,email', // ✅ nullable
        ]);

        Shipper::create($validated);

        return redirect()->route('shippers.index')->with('success', 'Shipper created successfully.');
    }

    public function edit(Shipper $shipper)
    {
        return Inertia::render('shippers/edit', ['shipper' => $shipper]);
    }

    public function update(Request $request, Shipper $shipper)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'address'  => 'nullable|string',      // ✅ diubah
            'city'     => 'nullable|string',
            'province' => 'nullable|string',
            'phone'    => 'nullable|string',
            'email'    => 'nullable|email|unique:shippers,email,' . $shipper->id, // ✅ nullable
        ]);

        $shipper->update($validated);

        return redirect()->route('shippers.index')->with('success', 'Shipper updated successfully.');
    }

    public function destroy(Shipper $shipper)
    {
        $shipper->delete(); // ini sekarang soft delete
        return redirect()->route('shippers.index')->with('success', 'Shipper deleted successfully.');
    }
}