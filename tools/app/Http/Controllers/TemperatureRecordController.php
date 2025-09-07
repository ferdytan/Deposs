<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\TemperatureRecord;
use App\Models\Product;
use App\Models\OrderItem;

class TemperatureRecordController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $records = OrderItem::with([
                'order:id,order_id,no_aju',
                'product:id,service_type',
                'rekamSuhu'
            ])
            ->when($search, function ($query, $search) {
                $query->where('container_number', 'LIKE', "%$search%");
            })
            ->paginate(10);

        return Inertia::render('temperature-records/index', [
            'records' => $records,
            'filters' => ['search' => $search],
        ]);
    }

}
