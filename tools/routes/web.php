<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\{
    UserController,
    CustomerController,
    ShipperController,
    ProductController,
    OrderController,
    InvoiceController,
    TemperatureRecordController,
    DashboardController
};


use App\Models\OrderItem;

Route::patch('/orders/{orderItem}/entry', [OrderController::class, 'updateEntry'])->name('orders.update-entry');
Route::patch('/orders/{orderItem}/eir', [OrderController::class, 'updateEir'])->name('orders.update-eir');
Route::patch('/orders/{orderItem}/exit', [OrderController::class, 'updateExit'])->name('orders.update-exit');


/* =====================================================
 |  PUBLIC ROUTES
 * =====================================================*/
Route::get('/', function () {
    return redirect('/login');
})->name('home');

/* =====================================================
 |  AUTHENTICATED ROUTES (verified dashboard)
 * =====================================================*/
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

});

/* =====================================================
 |  AUTHENTICATED ROUTES (main application)
 * =====================================================*/
Route::middleware(['auth'])->group(function () {

    /* ---------- USERS ---------- */
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::get('/create', [UserController::class, 'create'])->name('create');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{user}/edit', [UserController::class, 'edit'])->name('edit')->whereNumber('user');
        Route::put('/{user}', [UserController::class, 'update'])->name('update')->whereNumber('user');
        Route::post('/{user}/verify', [UserController::class, 'verify'])->name('verify')->whereNumber('user');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('destroy')->whereNumber('user');
    });

    /* ---------- CUSTOMERS ---------- */
    Route::prefix('customers')->name('customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('/create', [CustomerController::class, 'create'])->name('create');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('/{customer}/edit', [CustomerController::class, 'edit'])->name('edit')->whereNumber('customer');
        Route::put('/{customer}', [CustomerController::class, 'update'])->name('update')->whereNumber('customer');
        Route::delete('/{customer}', [CustomerController::class, 'destroy'])->name('destroy')->whereNumber('customer');
    });

    // API: Products belonging to a customer
    Route::get('/api/customers/{customer}/products', [CustomerController::class, 'productsForCustomer'])
        ->whereNumber('customer');

    /* ---------- SHIPPERS ---------- */
    Route::prefix('shippers')->name('shippers.')->group(function () {
        Route::get('/', [ShipperController::class, 'index'])->name('index');
        Route::get('/create', [ShipperController::class, 'create'])->name('create');
        Route::post('/', [ShipperController::class, 'store'])->name('store');
        Route::get('/{shipper}/edit', [ShipperController::class, 'edit'])->name('edit')->whereNumber('shipper');
        Route::put('/{shipper}', [ShipperController::class, 'update'])->name('update')->whereNumber('shipper');
        Route::delete('/{shipper}', [ShipperController::class, 'destroy'])->name('destroy')->whereNumber('shipper');
    });

    /* ---------- PRODUCTS ---------- */
    Route::prefix('products')->name('products.')->group(function () {
        Route::get('/search', [ProductController::class, 'search'])->name('search');
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('/create', [ProductController::class, 'create'])->name('create');
        Route::post('/', [ProductController::class, 'store'])->name('store');
        Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('edit')->whereNumber('product');
        Route::put('/{product}', [ProductController::class, 'update'])->name('update')->whereNumber('product');
        Route::delete('/{product}', [ProductController::class, 'destroy'])->name('destroy')->whereNumber('product');
    });

    Route::get('/karantina', [OrderController::class, 'index_karantina'])->name('index_karantina');

    /* ---------- ORDERS ---------- */
     Route::prefix('orders')->name('orders.')->group(function () {

        // Static endpoints
        Route::get('/unavailable', [OrderController::class, 'unavailable'])->name('unavailable');
        Route::get('/next-order-id', [OrderController::class, 'getNextOrderId']);

        // Collection endpoints
        Route::get('/', [OrderController::class, 'index'])->name('index');
        Route::get('/create', [OrderController::class, 'create'])->name('create');
        Route::post('/', [OrderController::class, 'store'])->name('store');

        // Detail order (lebih spesifik daripada /{order}/items/{...})
        Route::get('/{order}/detail', [OrderController::class, 'show'])->name('show')->whereNumber('order');

        // Route baru untuk detail order item berdasarkan ID item-nya saja
        // Ditempatkan di sini dalam grup prefix 'orders'
        Route::get('/item/{orderItem}', [OrderController::class, 'showOrderItemSimple'])
            ->name('items.simple.show') // Nama route yang lebih pendek dan jelas
            ->whereNumber('orderItem');

        // Edit order item
        Route::get('/{order}/items/{orderItem}/edit', [OrderController::class, 'editOrderItem'])
            ->name('items.edit')
            ->whereNumber(['order', 'orderItem']);

        // Order actions
        Route::post('/{order}/restore', [OrderController::class, 'restore'])->name('restore')->whereNumber('order');
        Route::get('/{order}/edit', [OrderController::class, 'edit'])->name('edit')->whereNumber('order');
        Route::put('/{order}', [OrderController::class, 'update'])->name('update')->whereNumber('order');
        Route::delete('/{order}', [OrderController::class, 'destroy'])->name('destroy')->whereNumber('order');

        // Order item actions
        // Route untuk detail item kompleks (jika masih digunakan)
        // Route::get('/{order}/items/{orderItem}', [OrderController::class, 'showOrderItem'])->name('items.show')->whereNumber(['order', 'orderItem']);
        Route::delete('/{order}/items/{orderItem}', [OrderController::class, 'destroyOrderItem'])
            ->name('items.destroy')
            ->whereNumber(['order', 'orderItem']);
    });



        Route::patch('/orders/{id}/temperature', [OrderController::class, 'updateTemperature'])->name('orders.update-temperature');


    /* ---------- TEMPERATURE RECORDS ---------- */
    Route::get('/temperature-records', [TemperatureRecordController::class, 'index'])
        ->name('temperature-records.index');

    /* ---------- INVOICES ---------- */
    // Route::prefix('invoices')->name('invoices.')->group(function () {
    //     Route::get('/', [InvoiceController::class, 'index'])->name('index');
    //     Route::get('/create', [InvoiceController::class, 'create'])->name('create');
    //     Route::post('/', [InvoiceController::class, 'store'])->name('store');
    //     Route::post('/preview', [InvoiceController::class, 'preview'])->name('preview');
    //     Route::get('/generate/{order}', [InvoiceController::class, 'generate'])->name('generate')->whereNumber('order');
    //     Route::get('/{invoice}/edit', [InvoiceController::class, 'edit'])->name('edit')->whereNumber('invoice');
    //     Route::put('/{invoice}', [InvoiceController::class, 'update'])->name('update')->whereNumber('invoice');
    //     Route::delete('/{invoice}', [InvoiceController::class, 'destroy'])->name('destroy')->whereNumber('invoice');
    //     Route::get('/{invoice}', [InvoiceController::class, 'show'])->name('show')->whereNumber('invoice');
    // });


    Route::prefix('invoices')->name('invoices.')->group(function () {
        Route::get('/create', [InvoiceController::class, 'create'])->name('create');
        // Route::post('/preview', [InvoiceController::class, 'preview'])->name('preview');
        Route::post('/store', [InvoiceController::class, 'store'])->name('store');
        Route::get('/', [InvoiceController::class, 'index'])->name('index');
        Route::get('/{invoice}', [InvoiceController::class, 'show'])->name('show');
    });

    // Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])->name('invoices.pay');
    Route::put('/invoices/{invoice}/unpay', [InvoiceController::class, 'unpay'])->name('invoices.unpay');


    Route::post('/invoices/preview', [InvoiceController::class, 'preview'])->name('invoices.preview');

    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');
    Route::put('/invoices/{invoice}/pay', [InvoiceController::class, 'pay'])
      ->name('invoices.pay');

    Route::put('/invoices/{invoice}/unpay', [InvoiceController::class, 'unpay'])
      ->name('invoices.unpay');

    Route::get('/orders/unavailable', [InvoiceController::class, 'getUnavailableOrderItems']);

});

/* =====================================================
 |  SYSTEM ROUTES
 * =====================================================*/
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
