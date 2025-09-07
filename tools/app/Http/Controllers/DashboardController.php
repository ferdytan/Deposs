<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Order;
use App\Models\Invoice;
use App\Models\TemperatureRecord;
use App\Models\CustomerProduct;
use App\Models\OrderAdditionalProduct;
use App\Models\Shipper;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\OrderItem;

class DashboardController extends Controller
{
    public function index()
{

    $user = auth()->user();

    $belumMasuk = OrderItem::whereNull('entry_date')->get(['id', 'order_id', 'container_number', 'entry_date', 'exit_date']);
    $belumKeluar = OrderItem::whereNull('exit_date')->get(['id', 'order_id', 'container_number', 'entry_date', 'exit_date']);

    $jumlahContainerMasuk = OrderItem::whereNotNull('entry_date')->count();
    $jumlahContainerBelumMasuk = $belumMasuk->count();
    $jumlahContainerBelumKeluar = $belumKeluar->count();

     // Product terlaris berdasarkan total qty per product_id
    $produkTerlaris = DB::table('order_items')
    ->join('products', 'order_items.product_id', '=', 'products.id')
    ->select('products.service_type as product_label', DB::raw('COUNT(order_items.id) as total_order'))
    ->groupBy('order_items.product_id', 'products.service_type')
    ->orderByDesc('total_order')
    ->limit(10)
    ->get();


    return inertia('dashboard', [
        'jumlahContainerMasuk' => $jumlahContainerMasuk,
        'jumlahContainerBelumMasuk' => $jumlahContainerBelumMasuk,
        'jumlahContainerBelumKeluar' => $jumlahContainerBelumKeluar,
        'dataContainerBelumMasuk' => $belumMasuk,
        'dataContainerBelumKeluar' => $belumKeluar,
        'produkTerlaris' => $produkTerlaris,
        'user_role_id' => $user->role_id, // Kirimkan ke frontend!
    ]);
}





}
