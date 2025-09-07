<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Order;   // <-- tambahkan baris ini

use NumberToWords\NumberToWords;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\ValidationException;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');

        $invoices = Invoice::with([
                'customer:id,name'  // hanya ambil id dan name
            ])
            ->withCount('items as items_count')
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $lowerSearch = strtolower($search);
                    $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($q) => $q->whereRaw('LOWER(name) LIKE ?', ["%{$lowerSearch}%"]))
                    ->orWhereHas('items', fn($q) => $q->where('container_number', 'like', "%{$search}%"))
                    ->orWhereHas('items', function ($q) use ($search) {
                        $q->whereRaw("JSON_CONTAINS(additional_products, ?)", ['"' . $search . '"']);
                    })
                    ->orWhereRaw("LOWER(status) LIKE ?", ["%{$lowerSearch}%"])
                    ->orWhereRaw("CAST(grand_total AS CHAR) LIKE ?", ["%{$search}%"]);
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->appends(['search' => $search]);

        // Hitung additional_qty_total
        $invoices->getCollection()->transform(function ($inv) {
            $total = 0;
            foreach ($inv->items as $item) {
                $adds = $item->additional_products ?? [];
                foreach ($adds as $ap) {
                    $qty = $ap['pivot']['quantity'] ?? $ap['quantity'] ?? 1;
                    $total += (int)$qty;
                }
            }
            $inv->additional_qty_total = $total;
            unset($inv->items); // agar tidak dikirim ke frontend
            return $inv;
        });

        return Inertia::render('invoices/index', [
            'invoices' => $invoices,
            'filters' => compact('search'),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }


    protected function companyInfo(): array
    {
        return [
            'name' => 'PT. DEPO SURABAYA SEJAHTERA',
            'address' => 'Jl. Tanjung Sadari No. 90',
            'phone' => 'Telp. 031-353 9484, 031-3539485',
            'fax' => 'Fax. 031-3539482',
        ];
    }

    public function create()
{
    // Ambil semua customer dengan order dan order_items serta relasi terkait
    $customers = Customer::with([
        'orders.order_items.product', // Muat produk untuk setiap order_item
        'orders.order_items.additionalProducts' // Muat produk tambahan untuk setiap order_item
    ])->get();

    // Modifikasi data $customers untuk menambahkan container_number ke level order
    // agar sesuai dengan ekspektasi frontend (CreateInvoice.tsx)
    $customers->transform(function ($customer) {
        $customer->orders->transform(function ($order) {
            // Tambahkan properti container_number ke objek order
            // berdasarkan container_number dari order_items-nya.
            if ($order->order_items->isNotEmpty()) {
                // Contoh: ambil container_number dari item pertama
                // Anda bisa ubah logika ini jika ingin menampilkan gabungan
                // dari beberapa container_number.
                $order->container_number = $order->order_items->first()->container_number ?? '-';
            } else {
                $order->container_number = 'Tidak ada kontainer';
            }

            // Opsional: Sembunyikan order_items jika tidak ingin dikirim
            // ke frontend dalam struktur ini (karena sudah diekstrak container_number-nya).
            // Hapus baris di bawah jika CreateInvoice.tsx masih membutuhkan order_items.
            // $order->makeHidden(['order_items']);

            return $order;
        });
        return $customer;
    });


    // Auto-generate invoice number
    $prefix = 'IN-1';
    $date = now()->format('m/Y');
    $latestInvoice = Invoice::where('invoice_number', 'like', "$prefix-$date-%")->first();
    $nextNumber = $latestInvoice ? ((int)substr($latestInvoice->invoice_number, -4)) + 1 : 1;
    $invoiceNumber = "$prefix-$date-" . sprintf("%04d", $nextNumber);

    return Inertia::render('invoices/create', [
        'customers' => $customers, // Data customer yang sudah dimodifikasi
        'invoice_number' => $invoiceNumber,
    ]);
}
    
    public function store(Request $request)
{
    $data = $request->validate([
        'customer_id'   => ['required','integer','exists:customers,id'],
        'period_start'  => ['required','date'],
        'period_end'    => ['required','date','after_or_equal:period_start'],
        'order_item_ids'=> ['required','array','min:1'],
        'order_item_ids.*' => ['integer'],
        'subtotal'      => ['required','integer','min:0'],
        'ppn'           => ['required','integer','min:0'],
        'materai'       => ['required','integer','min:0'],
        'grand_total'   => ['required','integer','min:0'],
        // HAPUS validasi terbilang sebagai input utama
        'additional_product_quantities' => ['array'],
        'additional_product_quantities.*.order_item_id' => ['required','integer'],
        'additional_product_quantities.*.additional_product_id' => ['required','integer'],
        'additional_product_quantities.*.quantity' => ['required','integer','min:1'],
    ]);

    return DB::transaction(function () use ($data) {
        $qtyMap = [];
        foreach (($data['additional_product_quantities'] ?? []) as $row) {
            $qtyMap[$row['order_item_id'].':'.$row['additional_product_id']] = (int) $row['quantity'];
        }

        $orderItems = OrderItem::with([
            'product:id,service_type',
            'additionalProducts' => fn($q) => $q->withPivot(['price_value']),
        ])->whereIn('id', $data['order_item_ids'])->get();

        if ($orderItems->isEmpty()) {
            abort(422, 'Order item tidak ditemukan.');
        }

        // Hitung ulang subtotal, ppn, grand_total
        $subtotal = 0;
        foreach ($orderItems as $oi) {
            $subtotal += (int) ($oi->price_value ?? 0);
            foreach ($oi->additionalProducts as $ap) {
                $price = (int) ($ap->pivot->price_value ?? 0);
                $qty   = (int) ($qtyMap[$oi->id.':'.$ap->id] ?? 1);
                $subtotal += $price * $qty;
            }
        }
        $materai = (int) ($data['materai'] ?? 0);
        $ppn     = (int) round($subtotal * 0.11);
        $grand   = $subtotal + $ppn + $materai;

        // VALIDASI: Pastikan grand_total dari client cocok
        if ($grand !== (int)$data['grand_total']) {
            throw ValidationException::withMessages([
                'grand_total' => ['Grand total tidak valid. Terjadi manipulasi data.']
            ]);
        }

        // ✅ GENERATE terbilang DI SERVER
        $terbilang = $this->numberToWords($grand);

        $invoiceNumber = $this->generateInvoiceNumber((int)$data['customer_id'], $data['period_start']);

        $invoice = Invoice::create([
            'invoice_number' => $invoiceNumber,
            'customer_id'    => (int) $data['customer_id'],
            'period_start'   => $data['period_start'],
            'period_end'     => $data['period_end'],
            'subtotal'       => $subtotal,
            'ppn'            => $ppn,
            'materai'        => $materai,
            'grand_total'    => $grand,
            'terbilang'      => $terbilang, // ✅ pakai hasil generate, bukan dari request
            'status'         => 'unpaid',
        ]);

        foreach ($orderItems as $oi) {
            $invItem = $invoice->items()->create([
                'order_item_id'    => $oi->id,
                'product_id'       => $oi->product_id,
                'container_number' => $oi->container_number,
                'price_type'       => $oi->price_type,
                'price_value'      => $oi->price_value,
                'quantity'         => 1,
            ]);

            $adds = [];
            foreach ($oi->additionalProducts as $ap) {
                $key = $oi->id.':'.$ap->id;
                $qty = (int) ($qtyMap[$key] ?? 1);
                $adds[] = [
                    'id'           => $ap->id,
                    'service_type' => $ap->service_type,
                    'pivot'        => [
                        'price_value' => (int) ($ap->pivot->price_value ?? 0),
                        'quantity'    => $qty,
                    ],
                ];
            }
            $invItem->additional_products = $adds;
            $invItem->save();
        }

        return redirect()
            ->route('invoices.show', $invoice->id)
            ->with('success', "Invoice {$invoice->invoice_number} berhasil disimpan.");
    });
}



    public function show(Invoice $invoice)
    {
        // Muat ulang invoice dengan payload yang dibutuhkan UI (tanpa mengubah relasi lama)
        $invoice = Invoice::withShowPayload()->findOrFail($invoice->id);

        // Ambil satu order untuk header (via helper firstOrder)
        $order = $invoice->firstOrder();
        $orderPayload = $order ? [
            'id'       => $order->id,
            'order_id' => $order->order_id,
        ] : null;

        // Map invoice_items → struktur yang dibutuhkan oleh show.tsx
        $orderItems = $invoice->items->map(function ($it) {
            return [
                'id'                  => $it->id,
                'container_number'    => $it->container_number,
                'price_value'         => (int) ($it->price_value ?? 0),
                'price_type'          => $it->price_type, // dipakai sebagai label service jika ada
                'product'             => $it->product ? ['service_type' => $it->product->service_type] : null,
                // additional_products tersimpan JSON (berisi pivot.price_value & pivot.quantity)
                'additional_products' => $it->additional_products ?? [],
            ];
        })->values();

        // Susun payload persis seperti yang diharapkan show.tsx (mirip InvoicePreview)
        $payload = [
            'id'             => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'period_start'   => $invoice->period_start,
            'period_end'     => $invoice->period_end,
            'subtotal'       => (int) $invoice->subtotal,
            'ppn'            => (int) $invoice->ppn,
            'materai'        => (int) $invoice->materai,
            'grand_total'    => (int) $invoice->grand_total,
            'terbilang'      => $invoice->terbilang,
            'status'         => strtolower($invoice->status ?? 'unpaid'),
            'customer'       => [
                'id'   => $invoice->customer->id,
                'name' => $invoice->customer->name,
            ],
            'order'        => $orderPayload,   // { id, order_id } atau null
            'order_items'  => $orderItems,     // array item untuk tabel
        ];

        // Info perusahaan (silakan ganti dari config/setting sesuai kebutuhan)
        $company = [
            'name'    => 'PT. DEPO SURABAYA SEJAHTERA',
            'address' => 'Jl. Tanjung Sadari No. 90',
            'phone'   => 'Telp. 031-353 9484, 031-3539485',
            'fax'     => 'Fax. 031-3539482',
        ];

        return Inertia::render('invoices/show', [
            'invoice' => $payload,
            'company' => $company,
        ]);
    }

    public function edit(Invoice $invoice)
    {
        $customers = Customer::select('id', 'name')->get();
        return Inertia::render('invoices/edit', ['invoice' => $invoice, 'customers' => $customers]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_number' => "required|string|max:255|unique:invoices,invoice_number,{$invoice->id}",
            'total_amount' => 'required|numeric|min:0',
        ]);

        $invoice->update($validated);

        return redirect()->route('invoices.index')->with('flash', ['success' => 'Invoice berhasil diperbarui!']);
    }

    public function destroy(Invoice $invoice)
    {
        // Hapus semua invoice_items terlebih dahulu
        $invoice->items()->delete();

        // Baru hapus invoice
        $invoice->delete();

        return redirect()
            ->route('invoices.index')
            ->with('success', 'Invoice berhasil dihapus!');
    }

    

    public function generate($orderId)
    {
        // Ambil order beserta relasi
        $order = Order::with(['customer', 'product', 'additionalProducts.product'])->findOrFail($orderId);

        // Hitung subtotal dari order + produk tambahan
        $basePrice = $order->price_value ?? 0;
        $additionalPrices = $order->additionalProducts->sum('price_value');
        $subtotal = $basePrice + $additionalPrices;

        // Hitung PPN (11%) dan Materai (Rp10,000)
        $ppn = $subtotal * 0.11;
        $materai = 10000;
        $grandTotal = $subtotal + $ppn + $materai;

        // Terbilang
        $terbilang = $this->numberToWords($grandTotal);

        // Auto-generate invoice number: INV-1/MM/YY-XXXX
        $prefix = 'INV-1';
        $date = now()->format('m/Y'); // Contoh: 07/24
        $latestInvoice = Invoice::where('invoice_number', 'like', "$prefix-$date-%")
            ->orderByDesc('id')
            ->first();
        
        $nextNumber = $latestInvoice ? ((int)substr($latestInvoice->invoice_number, -4)) + 1 : 1;
        $invoiceNumber = "$prefix-$date-" . sprintf("%04d", $nextNumber);

        // Buat invoice di database
        $invoice = Invoice::create([
            'order_id' => $order->id,
            'invoice_number' => $invoiceNumber,
            'customer_id' => $order->customer_id,
            'period_start' => $order->entry_date ?? now(),
            'period_end' => $order->exit_date ?? now()->addDays(7),
            'subtotal' => $subtotal,
            'ppn' => $ppn,
            'materai' => $materai,
            'grand_total' => $grandTotal,
            'terbilang' => $terbilang,
        ]);

        // Ambil semua item untuk ditampilkan
        $items = $this->getInvoiceItems($order);

        return Inertia::render('Invoices/Generate', [
            'invoice' => $invoice,
            'customer' => $order->customer,
            'items' => $items,
            'company' => [
                'name' => 'PT. DEPO SURABAYA SEJAHTERA',
                'address' => 'Jl. Tanjung Sadari No. 90',
                'phone' => 'Telp. 031-353 9484, 031-3539485',
                'fax' => 'Fax. 031-3539482',
            ]
        ]);
    }

    private function getInvoiceItems($order)
    {
        $items = [];

        // Layanan utama (contoh fumigasi)
        $items[] = [
            'no' => 1,
            'container_number' => $order->container_number,
            'size' => $this->getProductSize($order->product),
            'service' => $order->product->service_type,
            'price_per_unit' => $order->price_value,
            'total' => $order->price_value,
        ];

        // Layanan tambahan (jika ada)
        foreach ($order->additionalProducts as $i => $additional) {
            $items[] = [
                'no' => $i + 2,
                'container_number' => $order->container_number,
                'size' => $this->getProductSize($additional->product),
                'service' => $additional->product->service_type,
                'price_per_unit' => $additional->price_value,
                'total' => $additional->price_value,
            ];
        }

        return $items;
    }

    private function getProductSize($product)
    {
        return $product->requires_temperature ? '20 feet' : '40 feet'; // Sesuaikan logika ukuran kontainer
    }

    private function numberToWords(int|float $amount): string
    {
        $integer = (int) round($amount);

        // library ini tak butuh ekstensi intl
        $ntw       = new NumberToWords();
        $idWords   = $ntw->getNumberTransformer('id');   // bahasa Indonesia
        $words     = $idWords->toWords($integer);        // “sepuluh juta ...”

        $words = preg_replace('/\s+/', ' ', $words);     // rapikan spasi ganda
        return ucwords($words).' Rupiah';
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => ['nullable','string','max:100'],
            'customer_id'    => ['required','integer'],
            'order_id'       => ['required','integer','exists:orders,id'],
            'order_item_ids' => ['required','array','min:1'],
            'order_item_ids.*' => ['integer'],
            'period_start'   => ['required','date'],
            'period_end'     => ['required','date','after_or_equal:period_start'],
            'applyMaterai'   => ['boolean'],
            'materai'        => ['nullable','integer','min:0'],
            // HAPUS validasi terbilang di sini
            'additional_product_quantities' => ['array'],
            'additional_product_quantities.*.order_item_id' => ['required','integer'],
            'additional_product_quantities.*.additional_product_id' => ['required','integer'],
            'additional_product_quantities.*.quantity' => ['required','integer','min:1'],
        ]);

        $qtyMap = [];
        foreach (($validated['additional_product_quantities'] ?? []) as $row) {
            $key = $row['order_item_id'].':'.$row['additional_product_id'];
            $qtyMap[$key] = (int) $row['quantity'];
        }

        $order = Order::with([
            'customer:id,name',
            'order_items' => function ($q) use ($validated) {
                $q->whereIn('id', $validated['order_item_ids'] ?? []);
            },
            'order_items.product:id,service_type',
            'order_items.additionalProducts' => function ($q) {
                $q->withPivot(['price_value']);
            },
        ])->findOrFail($validated['order_id']);

        $subtotal = 0;
        foreach ($order->order_items as $item) {
            $subtotal += (int) ($item->price_value ?? 0);
            $item->additionalProducts->transform(function ($ap) use ($item, $qtyMap, &$subtotal) {
                $price = (int) ($ap->pivot->price_value ?? 0);
                $qty   = (int) ($qtyMap[$item->id.':'.$ap->id] ?? 1);
                $ap->pivot->quantity = $qty;
                $subtotal += $price * $qty;
                return $ap;
            });
        }

        $materai = (int) ($validated['applyMaterai'] ?? true ? ($validated['materai'] ?? 10000) : 0);
        $ppn     = (int) round($subtotal * 0.11);
        $grand   = $subtotal + $ppn + $materai;

        // ✅ Generate terbilang di backend
        $terbilang = $this->numberToWords($grand);

        $preview = [
            'customer'       => [
                'id'   => $order->customer->id,
                'name' => $order->customer->name,
            ],
            'invoice_number' => $validated['invoice_number'] ?? null,
            'order'          => $order->toArray(),
            'period_start'   => $validated['period_start'],
            'period_end'     => $validated['period_end'],
            'status'         => 'DRAFT',
            'subtotal'       => $subtotal,
            'ppn'            => $ppn,
            'materai'        => $materai,
            'grand_total'    => $grand,
            'terbilang'      => $terbilang, // ✅ bukan dari request
        ];

        return Inertia::render('invoices/InvoicePreview', [
            'preview' => $preview,
        ]);
    }


    // public function preview(Request $request)
    // {
    //     $orderItemIds = $request->input('order_item_ids', []);
    //     $orderItems = OrderItem::whereIn('id', $orderItemIds)->get();

    //     // Field lain seperti subtotal, ppn, dst
    //     $subtotal = $orderItems->sum('price_value');
    //     $ppn = round($subtotal * 0.11);
    //     $materai = $request->input('materai', 0);
    //     $grand_total = $subtotal + $ppn + $materai;

    //     return Inertia::render('invoices/show', [
    //         'invoice' => [
    //             // ...field invoice lain...
    //             'customer' => Customer::find($request->input('customer_id')),
    //             'order' => Order::find($request->input('order_id')),
    //             'order_items' => $orderItems,
    //             'subtotal' => $subtotal,
    //             'ppn' => $ppn,
    //             'materai' => $materai,
    //             'grand_total' => $grand_total,
    //             'terbilang' => $request->input('terbilang'),
    //             'status' => 'unpaid',
    //             'invoice_number' => $request->input('invoice_number'),
    //             'period_start' => $request->input('period_start'),
    //             'period_end' => $request->input('period_end'),
    //         ],
    //          'company' => [
    //             'name' => 'PT Contoh Sukses Jaya',
    //             'address' => 'Jl. Raya Contoh No. 99, Jakarta',
    //             'phone' => '021-1234567',
    //             'fax' => '021-7654321'
    //         ],
    //         'preview' => true,
    //     ]);
    // }


    public function pay(Invoice $invoice)
    {
        $invoice->update(['status' => 'paid']);
        return redirect()->back()->with('success', 'Status invoice berhasil diubah menjadi Lunas.');
    }

    public function unpay(Invoice $invoice)
    {
        $invoice->update(['status' => 'unpaid']);
        return redirect()->back()->with('success', 'Status invoice berhasil diubah menjadi Belum Lunas.');
    }

    private function generateInvoiceNumber(int $customerId, string $periodStart): string
    {
        // Format target: IN-{customerId}-{mm}/{YYYY}-{####}
        $month = date('m', strtotime($periodStart));
        $year  = date('Y', strtotime($periodStart));
        $prefix = "IN-{$customerId}-{$month}/{$year}-";

        // Lock baris-baris kandidat agar tidak race
        $last = Invoice::where('invoice_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->selectRaw("MAX(CAST(SUBSTRING_INDEX(invoice_number, '-', -1) AS UNSIGNED)) as max_seq")
            ->value('max_seq');

        $nextSeq = ($last ? (int)$last : 0) + 1;

        return $prefix . str_pad((string)$nextSeq, 4, '0', STR_PAD_LEFT);
    }


    public function getUnavailableOrderItems(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|integer|exists:customers,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
        ]);

        $customerId = $request->input('customer_id');
        $periodStart = $request->input('period_start');
        $periodEnd = $request->input('period_end');

        // Ambil semua order_item_id yang:
        // - Milik customer ini
        // - Ada di invoice yang periodenya OVERLAP dengan input
        // - Dan order_item tersebut SUDAH terinvoice (via invoice_items)

        $overlappingInvoices = Invoice::where('customer_id', $customerId)
            ->where(function ($q) use ($periodStart, $periodEnd) {
                // Cek overlap periode
                $q->whereBetween('period_start', [$periodStart, $periodEnd])
                ->orWhereBetween('period_end', [$periodStart, $periodEnd])
                ->orWhere(function ($q) use ($periodStart, $periodEnd) {
                    $q->where('period_start', '<=', $periodStart)
                        ->where('period_end', '>=', $periodEnd);
                });
            })
            ->pluck('id'); // Dapatkan invoice IDs

        // Ambil order_item_id dari invoice_items yang terkait
        $unavailableOrderItemIds = DB::table('invoice_items')
            ->whereIn('invoice_id', $overlappingInvoices)
            ->pluck('order_item_id')
            ->unique()
            ->values()
            ->all();

        return response()->json($unavailableOrderItemIds);
    }

}