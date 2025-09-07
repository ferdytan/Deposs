<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Customer;
use App\Models\Shipper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Models\OrderItem;

class OrderController extends Controller
{
   
   public function index(Request $request)
{
    $trashed = $request->input('trashed');
    $search = $request->input('search');

    $query = OrderItem::with([
        'order.customer',
        'order.shipper',
        'product',
        'additionalProducts',
        'rekamSuhu'
    ]);

    if ($trashed) {
        $query->onlyTrashed();
    }

    // 🔍 Pencarian hanya pada field yang muncul di tabel
    if ($search) {
        $query->where(function ($q) use ($search) {
            // Nama Customer
            $q->whereHas('order.customer', fn($q) => $q->where('name', 'like', "%{$search}%"))
              // Produk (service_type)
              ->orWhereHas('product', fn($q) => $q->where('service_type', 'like', "%{$search}%"))
              // Nomor Kontainer
              ->orWhere('container_number', 'like', "%{$search}%")
              // Size (price_type)
              ->orWhere('price_type', 'like', "%{$search}%")
              // Komoditi
              ->orWhere('commodity', 'like', "%{$search}%")
              // No. AJU
              ->orWhereHas('order', fn($q) => $q->where('no_aju', 'like', "%{$search}%"))
              // Order ID
              ->orWhereHas('order', fn($q) => $q->where('order_id', 'like', "%{$search}%"));
        });
    }

    // Urutkan
    $orders = $query->latest()->paginate(10);

    // Transform untuk tambahkan temperature
    $orders->getCollection()->transform(function ($item) {
        $data = $item->toArray();
        $data['temperature'] = [];
        foreach ($item->rekamSuhu as $rekam) {
            $data['temperature'][$rekam->tanggal] = $rekam->jam_data;
        }
        return $data;
    });

    return Inertia::render('orders/index', [
        'orders' => $orders,
        'filters' => [
            'search' => $search,
            'trashed' => $trashed,
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ]);
}




public function index_karantina(Request $request)
{
    $trashed = $request->input('trashed');
    $search = $request->input('search');

    // Query dasar: OrderItem yang terkait dengan Order yang fumigasinya tidak kosong
    $query = OrderItem::with([
        'order:id,customer_id,shipper_id,fumigasi', // pastikan customer_id ada
        'order.customer:id,name',                   // pastikan dimuat
        'order.shipper:id,name',
        'product',
        'additionalProducts',
        'rekamSuhu'
    ])
    ->whereHas('order', function ($q) {
        $q->whereNotNull('fumigasi')
          ->where('fumigasi', '!=', '')
          ->where('fumigasi', '!=', ' ');     // Opsional: hindari spasi saja
    });

    if ($trashed) {
        $query->onlyTrashed();
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->whereHas('order.customer', fn($q) => $q->where('name', 'like', "%$search%"))
              ->orWhereHas('order.shipper', fn($q) => $q->where('name', 'like', "%$search%"))
              ->orWhereHas('product', fn($q) => $q->where('service_type', 'like', "%$search%"))
              ->orWhere('container_number', 'like', "%$search%")
              ->orWhereHas('order', fn($q) => $q->where('no_aju', 'like', "%$search%"))
              ->orWhereHas('order', fn($q) => $q->where('fumigasi', 'like', "%$search%"));
        });
    }

    $orders = $query->latest()->paginate(10);

    $orders->getCollection()->transform(function ($item) {
        $data = $item->toArray();

        $data['temperature'] = [];
        foreach ($item->rekamSuhu as $rekam) {
            $data['temperature'][$rekam->tanggal] = $rekam->jam_data;
        }

        $data['fumigasi'] = $item->order->fumigasi ?? null;

        // Pastikan relasi terload
        $data['customer_name'] = $item->order->customer ? $item->order->customer->name : '-';
        $data['shipper_name'] = $item->order->shipper ? $item->order->shipper->name : '-';

        return $data;
    });

    return Inertia::render('karantina/index', [
        'orders' => $orders,
        'customers' => Customer::orderBy('name')->get(['id', 'name']), // ✅ Tambahkan ini
        'filters' => [
            'search' => $search,
            'trashed' => $trashed,
        ],
        'flash' => [
            'success' => session('success'),
            'error' => session('error'),
        ],
    ]);
}

//     public function index(Request $request)
// {
//     $trashed = $request->input('trashed');
//     $query = OrderItem::with([
//             'order.customer',
//             'order.shipper',
//             'product',
//             'additionalProducts',
//             'rekamSuhu'
//         ]);
    
//     if ($trashed) {
//         $query->onlyTrashed();
//     }
    
    
//     $orders = $query->latest()->paginate(10);
    
//     return Inertia::render('orders/index', [
//         'orders' => $orders,
//         'filters' => ['trashed' => $trashed],
//         'flash' => [
//             'success' => session('success'),
//             'error' => session('error'),
//         ],
//     ]);
// }

    // public function index(Request $request)
    // {
    //     $orders = OrderItem::with([
    //         'order.customer',
    //         'order.shipper',
    //         'product',
    //         'additionalProducts',
    //         'rekamSuhu'
    //     ])
    //     ->latest()
    //     ->paginate(10);

    //     return Inertia::render('orders/index', [
    //         'orders' => $orders,
    //     ]);
    // }
    

    public function create()
    {
        return Inertia::render('orders/create', [
            'customers' => Customer::all(),
            'shippers' => Shipper::all(),
        ]);
    }

    public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'customer_id' => 'required|exists:customers,id',
         'shipper_id'  => [ // Validasi dinamis
            function ($attribute, $value, $fail) use ($request) {
                $fumigasi = $request->input('fumigasi');
                if (!empty($fumigasi) && (!$value || !Shipper::find($value))) {
                    $fail('Shipper wajib diisi karena catatan fumigasi diisi.');
                }
            },
        ],
        'no_aju'      => 'nullable|string|max:255',
        'fumigasi'    => 'nullable|string|max:65535', // text field, bisa panjang
        'order_items' => 'required|array|min:1',
        'order_items.*.product_id'            => 'required|exists:products,id',
        'order_items.*.container_number'      => 'required|string|max:255|distinct',
        'order_items.*.entry_date'            => 'nullable|date',
        'order_items.*.eir_date'              => 'nullable|date',
        'order_items.*.exit_date'             => 'nullable|date',
        'order_items.*.commodity'             => 'nullable|string|max:255',
        'order_items.*.country'               => 'nullable|string|max:100',
        'order_items.*.vessel'                => 'nullable|string|max:255',
        // 'order_items.*.price_type'            => 'nullable|in:20ft,40ft,global',
        'order_items.*.price_type'            => 'required_with:order_items.*.product_id|in:20ft,40ft,global',
        'order_items.*.price_value'           => 'nullable|numeric',
        'order_items.*.additional_product_ids'=> 'nullable|array',
        'order_items.*.additional_product_ids.*' => 'exists:products,id',
        'order_items.*.additional_product_prices' => 'nullable|array',
        'order_items.*.additional_product_prices.*' => 'string|regex:/^\d+:\d+$/',
        'order_items.*.temperature'           => 'nullable|array',
        'order_items.*.temperature.*'         => 'array',
    ]);

    // Pastikan tetap validasi shipper_id jika fumigasi diisi
    if ($request->filled('fumigasi')) {
        $validator->sometimes('shipper_id', 'required|exists:shippers,id', function () {
            return true;
        });
    }

    if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
    }

    $validated = $validator->validated();

    DB::beginTransaction();

    try {
        // Buat order baru
        $order = Order::create([
            'customer_id' => $validated['customer_id'],
            'shipper_id' => $validated['shipper_id'] ?? null, // tetap bisa null
            'no_aju' => $validated['no_aju'] ?? null,
             'fumigasi' => $validated['fumigasi'] ?? null, // bisa true, false, atau null
        ]);

        // Generate order_id
        $orderCode = 'ORD-' . date('Ymd') . '-' . $order->id;
        $order->update(['order_id' => $orderCode]);

        // Proses setiap item
        foreach ($validated['order_items'] as $itemData) {
            $orderItem = $order->items()->create([
                'product_id' => $itemData['product_id'],
                'container_number' => $itemData['container_number'],
                'entry_date' => $itemData['entry_date'] ?? null,
                'eir_date' => $itemData['eir_date'] ?? null,
                'exit_date' => $itemData['exit_date'] ?? null,
                'commodity' => $itemData['commodity'] ?? null,
                'country' => $itemData['country'] ?? null,
                'vessel' => $itemData['vessel'] ?? null,
                'price_type' => $itemData['price_type'] ?? 'global',
                'price_value' => $itemData['price_value'] ?? null,
            ]);

            // === PROSES PRODUK TAMBAHAN ===
            $syncData = [];

            if (!empty($itemData['additional_product_ids'])) {
                // Ambil produk utama
                $productMain = \App\Models\Product::find($itemData['product_id']);
                if (!$productMain) {
                    return back()->withErrors(['error' => 'Produk utama tidak ditemukan.'])->withInput();
                }

                // Parse additional_product_prices
                $additionalPrices = [];
                if (!empty($itemData['additional_product_prices']) && is_array($itemData['additional_product_prices'])) {
                    foreach ($itemData['additional_product_prices'] as $pair) {
                        if (strpos($pair, ':') === false) continue;
                        [$id, $price] = explode(':', $pair, 2);
                        $additionalPrices[(int)$id] = (float)$price;
                    }
                }

                // Buat data sinkronisasi
                foreach ($itemData['additional_product_ids'] as $additional_product_id) {
                    $productId = (int)$additional_product_id;

                    // Gunakan harga khusus jika tersedia
                    if (isset($additionalPrices[$productId])) {
                        $priceValue = $additionalPrices[$productId];
                    } else {
                        // Jika tidak ada, gunakan dari getPriceForType()
                        $priceValue = $this->getPriceForType($productMain, $itemData['price_type'] ?? 'global', $order);
                    }

                    $syncData[$productId] = [
                        'price_value' => $priceValue,
                    ];
                }

                // Sinkronisasi produk tambahan
                $orderItem->additionalProducts()->sync($syncData);
            }

            // --- REKAM SUHU ---
            if (!empty($itemData['temperature']) && is_array($itemData['temperature'])) {
                foreach ($itemData['temperature'] as $tanggal => $jamData) {
                    if (is_string($tanggal) && is_array($jamData)) {
                        $orderItem->rekamSuhu()->create([
                            'tanggal' => $tanggal,
                            'jam_data' => $jamData,
                        ]);
                    }
                }
            }
        }

        DB::commit();

        return redirect()->route('orders.index')->with('success', 'Order berhasil dibuat.');

    } catch (\Exception $e) {
        DB::rollBack();
        return back()->withErrors(['error' => 'Terjadi kesalahan saat menyimpan: ' . $e->getMessage()])->withInput();
    }
}

    public function show(Order $order)
    {
        $order->load([
            'customer:id,name',
            'shipper:id,name',
            'items.product:id,service_type',
            'items.additionalProducts:id,service_type',
            'items.rekamSuhu'
        ]);

        return Inertia::render('orders/show', [
            'order' => $order
        ]);
    }

    public function showOrderItemSimple(OrderItem $orderItem)
    {
        // $orderItem sudah di-resolve oleh Route Model Binding

        // Load relasi yang diperlukan
        $orderItem->load([
            'order.customer:id,name',
            'order.shipper:id,name',
            'product',
            'additionalProducts',
            'rekamSuhu'
        ]);

        // Ambil order terkait
        $order = $orderItem->order;

        // Validasi dasar jika diperlukan
        if (!$order) {
            abort(404, 'Order tidak ditemukan untuk item ini.');
        }

        return Inertia::render('orders/show_item', [
            'order' => $order,
            'orderItem' => $orderItem,
        ]);
    }

    public function showOrderItem(Order $order, OrderItem $orderItem)
    {
        // Debug logging
        \Log::info('Show Order Item Request', [
            'order_id' => $order->id ?? 'not found',
            'order_item_id' => $orderItem->id ?? 'not found',
            'order_item_order_id' => $orderItem->order_id ?? 'null',
            'match' => ($orderItem->order_id ?? null) === ($order->id ?? null)
        ]);

        // Validasi yang lebih fleksibel
        if (!$orderItem->exists || !$order->exists) {
            \Log::warning('Order or OrderItem not found');
            abort(404, 'Data tidak ditemukan');
        }

        if ($orderItem->order_id !== $order->id) {
            \Log::warning('Order item mismatch', [
                'expected_order_id' => $order->id,
                'actual_order_id' => $orderItem->order_id
            ]);
            abort(404, 'Order item tidak sesuai dengan order');
        }

        $orderItem->load([
            'product',
            'additionalProducts',
            'rekamSuhu'
        ]);

        return Inertia::render('orders/show_item', [
            'order' => $order,
            'orderItem' => $orderItem,
        ]);
    }


   public function edit($id)
    {
        $order = Order::with([
            'items.product',
            'items.additionalProducts', // Ini membawa pivot price_value
            'items.rekamSuhu',
        ])->findOrFail($id);

        // Transform setiap item untuk menambahkan additional_product_prices
        $order->items->transform(function ($item) {
            $data = $item->toArray();

            // === TAMBAHKAN additional_product_prices ===
            $additionalPrices = [];
            foreach ($item->additionalProducts as $product) {
                $additionalPrices[] = "{$product->id}:{$product->pivot->price_value}";
            }
            $data['additional_product_prices'] = $additionalPrices;

            // === TAMBAHKAN temperature dari rekamSuhu ===
            $data['temperature'] = [];
            foreach ($item->rekamSuhu as $rekam) {
                $data['temperature'][$rekam->tanggal] = $rekam->jam_data;
            }

            return $data;
        });

        return Inertia::render('orders/edit', [
            'order' => $order,
            'customers' => Customer::all(['id', 'name']),
            'shippers' => Shipper::all(['id', 'name']),
        ]);
    }


public function update(Request $request, Order $order)
{
    $validator = Validator::make($request->all(), [
        'customer_id' => 'required|exists:customers,id',
        'shipper_id'  => [
            function ($attribute, $value, $fail) use ($request) {
                $fumigasi = $request->input('fumigasi');
                if (!empty($fumigasi) && (!$value || !Shipper::find($value))) {
                    $fail('Shipper wajib diisi karena catatan fumigasi diisi.');
                }
            },
        ],
        'no_aju'      => 'nullable|string|max:255',
        'fumigasi'    => 'nullable|string|max:65535', // text field, bisa panjang
        'order_items' => 'required|array|min:1',
        'order_items.*.id'                    => 'nullable|integer|exists:order_items,id',
        'order_items.*.product_id'            => 'required|exists:products,id',
        'order_items.*.container_number'      => 'required|string|max:255',
        'order_items.*.entry_date'            => 'nullable|date',
        'order_items.*.eir_date'              => 'nullable|date',
        'order_items.*.exit_date'             => 'nullable|date',
        'order_items.*.commodity'             => 'nullable|string|max:255',
        'order_items.*.country'               => 'nullable|string|max:100',
        'order_items.*.vessel'                => 'nullable|string|max:255',
        'order_items.*.price_type'            => 'nullable|in:20ft,40ft,global',
        'order_items.*.price_value'           => 'nullable|numeric',
        'order_items.*.additional_product_ids'=> 'nullable|array',
        'order_items.*.additional_product_ids.*' => 'exists:products,id',
        'order_items.*.additional_product_prices' => 'nullable|array',
        'order_items.*.additional_product_prices.*' => 'string|regex:/^\d+:\d+$/',
        'order_items.*.temperature'           => 'nullable|array',
        'order_items.*.temperature.*'         => 'array',
    ]);

     // Tambahkan validasi required jika fumigasi diisi
    if ($request->filled('fumigasi')) {
        $validator->sometimes('shipper_id', 'required|exists:shippers,id', function () {
            return true;
        });
    }

    if ($validator->fails()) {
        return back()->withErrors($validator)->withInput();
    }

    $validated = $validator->validated();

    // Validasi duplikat ID dalam additional_product_ids (dalam satu item)
    foreach ($validated['order_items'] as $itemIndex => $item) {
        if (!empty($item['additional_product_ids'])) {
            $duplicates = array_diff_assoc(
                $item['additional_product_ids'],
                array_unique($item['additional_product_ids'])
            );
            if (!empty($duplicates)) {
                return back()->withErrors([
                    "order_items.$itemIndex.additional_product_ids" => "ID produk tambahan tidak boleh duplikat."
                ])->withInput();
            }
        }
    }

    DB::beginTransaction();

    try {
        // Update order utama
        $order->update([
            'customer_id' => $validated['customer_id'],
            'shipper_id' => $validated['shipper_id'] ?? null,
            'no_aju' => $validated['no_aju'] ?? null,
            'fumigasi' => $validated['fumigasi'] ?? null,
        ]);

        // Buat peta kontainer untuk validasi duplikat
        $containerMap = [];
        foreach ($validated['order_items'] as $item) {
            $containerMap[] = [
                'id' => $item['id'] ?? null,
                'number' => strtoupper(trim($item['container_number'])),
            ];
        }

        // Ambil semua item id yang sebelumnya ada
        $existingItemIds = $order->items()->pluck('id')->toArray();
        $incomingItemIds = collect($validated['order_items'])->pluck('id')->filter()->toArray();

        // Hapus item lama yang tidak lagi dikirim (dan relasinya)
        $itemsToDelete = array_diff($existingItemIds, $incomingItemIds);
        if (!empty($itemsToDelete)) {
            OrderItem::whereIn('id', $itemsToDelete)->each(function ($item) {
                $item->rekamSuhu()->forceDelete(); // Hapus rekam suhu fisik
                $item->additionalProducts()->detach(); // Hapus relasi produk tambahan
                $item->delete(); // Hapus item
            });
        }

        // Proses setiap item dari request
        foreach ($validated['order_items'] as $itemData) {
            $currentId = $itemData['id'] ?? null;
            $currentNumber = strtoupper(trim($itemData['container_number']));

            // Validasi duplikasi kontainer (kecuali dirinya sendiri)
            $duplicateFound = false;
            foreach ($containerMap as $check) {
                if ($check['number'] === $currentNumber && $check['id'] !== $currentId) {
                    $duplicateFound = true;
                    break;
                }
            }
            if ($duplicateFound) {
                throw new \Exception("Nomor kontainer '{$itemData['container_number']}' sudah digunakan dalam order ini.");
            }

            if ($currentId) {
                // --- UPDATE ITEM LAMA ---
                $orderItem = OrderItem::find($currentId);
                if (!$orderItem) continue;

                // Update atribut dasar item
                $orderItem->update([
                    'product_id' => $itemData['product_id'],
                    'container_number' => $itemData['container_number'],
                    'entry_date' => $itemData['entry_date'] ?? null,
                    'eir_date' => $itemData['eir_date'] ?? null,
                    'exit_date' => $itemData['exit_date'] ?? null,
                    'commodity' => $itemData['commodity'] ?? null,
                    'country' => $itemData['country'] ?? null,
                    'vessel' => $itemData['vessel'] ?? null,
                    'price_type' => $itemData['price_type'] ?? 'global',
                    'price_value' => $itemData['price_value'] ?? null,
                ]);

                // === PROSES PRODUK TAMBAHAN (UPDATE) ===
$syncData = [];

// Ambil semua produk tambahan yang sudah ada di database (untuk fallback)
$existingAdditionalProducts = $orderItem->additionalProducts()->get()->keyBy('id');

// Ambil produk utama
$productMain = \App\Models\Product::find($itemData['product_id']);
if (!$productMain) {
    return back()->withErrors(['error' => 'Produk utama tidak ditemukan.'])->withInput();
}

// Parse additional_product_prices jika ada di input
$additionalPrices = [];
if (!empty($itemData['additional_product_prices']) && is_array($itemData['additional_product_prices'])) {
    foreach ($itemData['additional_product_prices'] as $pair) {
        if (strpos($pair, ':') === false) continue;
        [$id, $price] = explode(':', $pair, 2);
        $additionalPrices[(int)$id] = (float)$price;
    }
}

// Buat syncData berdasarkan additional_product_ids dari input
foreach ($itemData['additional_product_ids'] as $additional_product_id) {
    $productId = (int)$additional_product_id;

    // Gunakan harga dari additional_product_prices jika tersedia
    if (isset($additionalPrices[$productId])) {
        $priceValue = $additionalPrices[$productId];
    }
    // Jika tidak ada, coba ambil dari database lama (jika ada)
    elseif (isset($existingAdditionalProducts[$productId])) {
        $priceValue = $existingAdditionalProducts[$productId]->pivot->price_value;
    }
    // Jika tidak ada di input maupun database, gunakan fallback
    else {
        // Ambil harga dari customer_product berdasarkan product_id dan customer_id
        $customerProduct = \App\Models\CustomerProduct::where('customer_id', $order->customer_id)
            ->where('product_id', $productId)
            ->first();

        if ($customerProduct && isset($customerProduct->custom_global_price)) {
            $priceValue = (float)$customerProduct->custom_global_price;
        } else {
            // Jika tidak ada di customer_product, gunakan price_global dari produk
            $priceValue = (float)($productMain->price_global ?? 0);
        }
    }

    $syncData[$productId] = [
        'price_value' => $priceValue,
    ];
}

// Sinkronisasi produk tambahan
$orderItem->additionalProducts()->sync($syncData);

                // --- UPDATE REKAM SUHU UNTUK ITEM LAMA ---
                $orderItem->rekamSuhu()->forceDelete(); // Hapus semua rekaman lama

                if (!empty($itemData['temperature']) && is_array($itemData['temperature'])) {
                    foreach ($itemData['temperature'] as $tanggal => $jamData) {
                        if (is_string($tanggal) && is_array($jamData)) {
                            $orderItem->rekamSuhu()->create([
                                'tanggal' => $tanggal,
                                'jam_data' => $jamData,
                            ]);
                        }
                    }
                }

            } else {
                // --- TAMBAH ITEM BARU ---
                $orderItem = $order->items()->create([
                    'product_id' => $itemData['product_id'],
                    'container_number' => $itemData['container_number'],
                    'entry_date' => $itemData['entry_date'] ?? null,
                    'eir_date' => $itemData['eir_date'] ?? null,
                    'exit_date' => $itemData['exit_date'] ?? null,
                    'commodity' => $itemData['commodity'] ?? null,
                    'country' => $itemData['country'] ?? null,
                    'vessel' => $itemData['vessel'] ?? null,
                    'price_type' => $itemData['price_type'] ?? 'global',
                    'price_value' => $itemData['price_value'] ?? null,
                ]);

                // === PROSES PRODUK TAMBAHAN (BARU) ===
                $syncData = [];

                $productMain = \App\Models\Product::find($itemData['product_id']);
                if (!$productMain) {
                    return back()->withErrors(['error' => 'Produk utama tidak ditemukan.'])->withInput();
                }

                $additionalPrices = [];
                if (!empty($itemData['additional_product_prices']) && is_array($itemData['additional_product_prices'])) {
                    foreach ($itemData['additional_product_prices'] as $pair) {
                        if (strpos($pair, ':') === false) continue;
                        [$id, $price] = explode(':', $pair, 2);
                        $additionalPrices[(int)$id] = (float)$price;
                    }
                }

                foreach ($itemData['additional_product_ids'] as $additional_product_id) {
                    $productId = (int)$additional_product_id;

                    if (isset($additionalPrices[$productId])) {
                        $priceValue = $additionalPrices[$productId];
                    } else {
                        $priceValue = $this->getPriceForType($productMain, $itemData['price_type'] ?? 'global', $order);
                    }

                    $syncData[$productId] = [
                        'price_value' => $priceValue,
                    ];
                }

                $orderItem->additionalProducts()->sync($syncData);

                // --- TAMBAH REKAM SUHU UNTUK ITEM BARU ---
                if (!empty($itemData['temperature']) && is_array($itemData['temperature'])) {
                    foreach ($itemData['temperature'] as $tanggal => $jamData) {
                        if (is_string($tanggal) && is_array($jamData)) {
                            $orderItem->rekamSuhu()->create([
                                'tanggal' => $tanggal,
                                'jam_data' => $jamData,
                            ]);
                        }
                    }
                }
            }
        }

        DB::commit();

        return redirect()->route('orders.index')->with('success', 'Order berhasil diperbarui.');

    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Order Update Error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString(), 'user_id' => auth()->id()]);
        return back()->withErrors(['error' => 'Terjadi kesalahan saat menyimpan: ' . $e->getMessage()])->withInput();
    }
}






   public function destroy(Order $order, Request $request)
{
    $deleteReason = $request->input('delete_reason');

    DB::beginTransaction();
    try {
        foreach ($order->items as $item) {
            $item->update(['delete_reason' => $deleteReason]);
            $item->rekamSuhu()->delete();
            $item->additionalProducts()->detach();
            $item->delete(); // <--- pastikan ini dijalankan
        }
        $order->update(['delete_reason' => $deleteReason]);
        $order->delete();
        DB::commit();
        return redirect()->route('orders.index')->with('success', 'Order berhasil dihapus.');
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->route('orders.index')->with('error', 'Gagal menghapus order: '.$e->getMessage());
    }
}








    /**
     * Soft delete untuk order item
     */
    public function destroyOrderItem(OrderItem $orderItem, Request $request)
    {
        $deleteReason = $request->input('delete_reason');

        DB::beginTransaction();
        try {
            $orderItem->update(['delete_reason' => $deleteReason]);
            $orderItem->rekamSuhu()->delete();
            $orderItem->additionalProducts()->detach();
            $orderItem->delete();

            DB::commit();
            return back()->with('success', 'Order Item berhasil dihapus.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', 'Gagal menghapus order item: ' . $e->getMessage());
        }
    }







    public function updateEntry(Request $request, OrderItem $orderItem) {
        $request->validate(['entry_date' => 'required|date']);
        $orderItem->entry_date = $request->entry_date;
        $orderItem->save();
        return back()->with('success', 'Tanggal masuk diperbarui.');
    }


    public function updateEir(Request $request, OrderItem $orderItem) {
        $request->validate([
            'eir_date' => 'required|date',
        ]);

        $orderItem->eir_date = $request->eir_date;
        $orderItem->save();

        return back()->with('success', 'Tanggal EIR berhasil diperbarui.');
    }

    public function updateExit(Request $request, OrderItem $orderItem) {
        $request->validate([
            'exit_date' => 'required|date',
        ]);

        $orderItem->exit_date = $request->exit_date;
        $orderItem->save();

        return back()->with('success', 'Tanggal keluar berhasil diperbarui.');
    }

    public function restore($id)
{
    $order = Order::onlyTrashed()->findOrFail($id);
    DB::beginTransaction();
    try {
        // Pulihkan order utama
        $order->restore();
        
        // Pulihkan semua item order
        $order->items()->onlyTrashed()->restore();
        
        // Pulihkan semua rekam suhu dan relasi produk tambahan untuk setiap item
        foreach ($order->items()->onlyTrashed()->get() as $item) {
            $item->rekamSuhu()->onlyTrashed()->restore();
            
            // Pulihkan relasi produk tambahan
            // Karena tidak ada soft delete untuk pivot table, kita perlu memulihkan dengan cara lain
            // Jika Anda menggunakan package untuk soft delete pivot, gunakan method restore
            // Jika tidak, Anda mungkin perlu menyimpan histori relasi di tabel terpisah
        }
        
        DB::commit();
        return redirect()->route('orders.index')->with('success', 'Order berhasil dipulihkan.');
    } catch (\Exception $e) {
        DB::rollBack();
        return redirect()->route('orders.index')->with('error', 'Gagal memulihkan order: '.$e->getMessage());
    }
}


public function updateTemperature(Request $request, $id)
{
    $request->validate([
        'temperature' => 'required|array',
    ]);

    // Hapus semua rekaman suhu untuk order_item ini dulu
    \DB::table('order_item_rekam_suhus')->where('order_item_id', $id)->delete();

    // Simpan data baru dari frontend
    foreach ($request->temperature as $tanggal => $jam_data) {
        \DB::table('order_item_rekam_suhus')->insert([
            'order_item_id' => $id,
            'tanggal' => $tanggal,
            'jam_data' => json_encode($jam_data),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    return redirect()->back()->with('success', 'Rekam suhu berhasil disimpan');

}


// private function getPriceForType($product, $priceType, $order)
// {
//     if (!$order) return 0;

//     $customerId = $order->customer_id;

//     $customerProduct = \App\Models\CustomerProduct::where('customer_id', $customerId)
//         ->where('product_id', $product->id)
//         ->first();

//     if ($customerProduct) {
//         switch ($priceType) {
//             case '20ft':
//                 // return $customerProduct->custom_price_20ft ?? 0;
//                 return $customerProduct->custom_global_price ?? 0;
//             case '40ft':
//                 // return $customerProduct->custom_price_40ft ?? 0;
//                 return $customerProduct->custom_global_price ?? 0;
//             case 'global':
//                 return $customerProduct->custom_global_price ?? 0;
//             default:
//                 return 0;
//         }

//         // return $customerProduct->custom_global_price ?? 0;
//     }

//     // Fallback ke product default
//     switch ($priceType) {
//         case '20ft':
//             // return $product->price_20ft ?? 0;
//             return $product->price_global ?? 0;
//         case '40ft':
//             // return $product->price_40ft ?? 0;
//             return $product->price_global ?? 0;
//         case 'global':
//             return $product->price_global ?? 0;
//         default:
//             return 0;
//     }
// }


private function getPriceForType($product, $priceType, $order)
{
    if (!$order) return 0;

    // Ambil customer_id dari order
    $customerId = $order->customer_id;

    // Cari harga khusus untuk produk ini berdasarkan customer_id
    $customerProduct = \App\Models\CustomerProduct::where('customer_id', $customerId)
        ->where('product_id', $product->id)
        ->first();

    // Jika ada harga khusus, gunakan custom_global_price
    if ($customerProduct && isset($customerProduct->custom_global_price)) {
        return (float)$customerProduct->custom_global_price;
    }

    // Jika tidak ada harga khusus, gunakan harga global dari produk
    return (float)($product->price_global ?? 0);
}

}
