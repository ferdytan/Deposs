import AppLayout from '@/layouts/app-layout';
import InvoicesLayout from '@/layouts/invoices/layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Dropdown } from 'primereact/dropdown';
import { useEffect, useState } from 'react';
// UI Components
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Types
interface Order {
    id: number;
    order_id: string; // <-- tambahkan baris ini!
    container_number: string;
    price_value: number;
    entry_date: string | null;

    exit_date: string | null;
    additionalProducts: Array<{
        id: number;
        product_id: number;
        price_value: number;
    }>;
    order_items: OrderItem[]; // <-- TAMBAHKAN INI!
}
type AxiosErrorResponse = {
    response?: {
        status?: number;
        data?: {
            errors?: Record<string, string[]>;
        };
    };
};
interface Product {
    id: number;
    // name: string;
    service_type: string;
    // Tambahkan property lain sesuai dengan tabel products jika perlu
}

interface OrderItem {
    id: number;
    container_number: string;
    price_value: number;
    // ...property lain
    product_id: number;
    product?: Product; // <-- Tambahkan ini!
    additional_products: Array<{
        id: number;
        service_type: string;
        pivot: {
            price_value: number;
        };
    }>;
}

interface Customer {
    id: number;
    name: string;
    orders: Order[]; // Orders sudah termasuk dalam customer
}

interface PageProps {
    [k: string]: unknown;
    customers: Customer[];
    invoice_number?: string;
}

export default function CreateInvoice() {
    const [disabledOrders, setDisabledOrders] = useState<Set<number>>(new Set());

    const [errors, setErrors] = useState<Record<string, string[]>>({});

    // --- state baru untuk quantity additional product ---
    // di dekat state lain
    const [addQty, setAddQty] = useState<Record<string, number>>({}); // NEW
    const qtyKey = (itemId: number, prodId: number) => `${itemId}:${prodId}`; // NEW
    const getQty = (itemId: number, prodId: number) => addQty[qtyKey(itemId, prodId)] ?? 1; // NEW
    const setQty = (itemId: number, prodId: number, val: number) => {
        // NEW
        const v = Number.isFinite(val) && val > 0 ? Math.floor(val) : 1;
        setAddQty((prev) => ({ ...prev, [qtyKey(itemId, prodId)]: v }));
    }; // NEW

    const [generalError, setGeneralError] = useState<string | null>(null);

    const page = usePage<PageProps>();
    const { customers, invoice_number } = page.props;

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // const [selectedOrderDetails, setSelectedOrderDetails] = useState<Record<number, Order>>({});

    const [form, setForm] = useState({
        customer_id: '',
        invoice_number: invoice_number || '',
        period_start: today.toISOString().split('T')[0],
        period_end: nextWeek.toISOString().split('T')[0],
        subtotal: 0,
        ppn: 0,
        grand_total: 0,
        terbilang: '',
        applyMaterai: true, // Default materai aktif
        materai: 10000, // Default nilai materai
    });

    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedContainers, setSelectedContainers] = useState<Set<number>>(new Set());

    const [selectedOrderId, setSelectedOrderId] = useState<string>('');

    useEffect(() => {
        console.log('DATA ORDERS', orders);
    }, [orders]);

    // Ambil orders berdasarkan customer_id (dari data yang sudah dikirim via Inertia)
    useEffect(() => {
        if (selectedCustomerId) {
            const customer = customers.find((c) => c.id.toString() === selectedCustomerId);
            if (customer) {
                setOrders(customer.orders || []);
            }
        } else {
            setOrders([]);
        }
    }, [selectedCustomerId, customers]);

    useEffect(() => {
        if (orders.length > 0) {
            console.log('[DEBUG] Orders Loaded:', orders);
        }
    }, [orders]);

    useEffect(() => {
        if (!selectedCustomerId) {
            setDisabledOrders(new Set());
            return;
        }

        const url = `/orders/unavailable?customer_id=${selectedCustomerId}&period_start=${form.period_start}&period_end=${form.period_end}`;

        fetch(url)
            .then((r) => r.json())
            .then((ids: number[]) => {
                setDisabledOrders(new Set(ids));
                // Hapus pilihan jika kontainer jadi disabled
                setSelectedContainers((prev) => {
                    const copy = new Set([...prev].filter((id) => !ids.includes(id)));
                    return copy;
                });
            })
            .catch(console.error);
    }, [selectedCustomerId, form.period_start, form.period_end]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const numberToWords = (num: number): string => {
        // Gunakan library atau fungsi dummy
        return 'Sepuluh Juta Tujuh Ratus Sembilan Puluh Sembilan Ribu Dua Ratus Rupiah';
    };

    useEffect(() => {
        if (orders.length > 0 && selectedContainers.size > 0 && selectedOrderId) {
            const { subtotal, ppn, grandTotal, terbilang } = calculateInvoiceTotals(
                orders,
                selectedOrderId,
                selectedContainers,
                form.materai,
                numberToWords,
                addQty, // NEW
            );

            setForm((prev) => ({
                ...prev,
                subtotal,
                ppn,
                grand_total: grandTotal,
                terbilang,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                subtotal: 0,
                ppn: 0,
                grand_total: 0,
                terbilang: '',
            }));
        }
    }, [selectedContainers, orders, form.materai, selectedOrderId, addQty]);

    // tambahkan parameter addQty pada calculateInvoiceTotals
    function calculateInvoiceTotals(
        orders: Order[],
        selectedOrderId: string,
        selectedContainers: Set<number>,
        materai: number,
        numberToWords: (num: number) => string,
        addQty: Record<string, number>, // NEW
    ) {
        let subtotal = 0;
        const selectedOrder = orders.find((order) => order.id.toString() === selectedOrderId);

        if (selectedOrder) {
            selectedOrder.order_items.forEach((item) => {
                if (selectedContainers.has(item.id)) {
                    // harga produk utama TIDAK dikali qty
                    subtotal += Number(item.price_value || 0);

                    // additional product DIKALI qty
                    item.additional_products?.forEach((prod) => {
                        const qty = addQty[`${item.id}:${prod.id}`] ?? 1;
                        subtotal += Number(prod.pivot?.price_value || 0) * qty;
                    });
                }
            });
        }

        const ppn = Math.round(subtotal * 0.11);
        const grandTotal = subtotal + ppn + materai;
        const terbilang = numberToWords(grandTotal);

        return { subtotal, ppn, grandTotal, terbilang };
    }

    const handleCustomerChange = (value: string) => {
        setSelectedCustomerId(value);
        setSelectedOrderId(''); // reset pilihan order saat customer berubah
        setSelectedContainers(new Set());
        // setSelectedOrderDetails({});
    };

    const handleOrderChange = (value: string) => {
        setSelectedOrderId(value);
        setSelectedContainers(new Set());

        const selected = orders.find((o) => o.id.toString() === value);
        console.log('[DEBUG] Selected Order:', selected);
    };

    const handleContainerCheck = (itemId: number, checked: boolean) => {
        const newSelected = new Set(selectedContainers);

        if (checked) {
            newSelected.add(itemId);
        } else {
            newSelected.delete(itemId);
        }

        setSelectedContainers(newSelected);
    };

    // const handleSubmit = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     router.post('/invoices', {
    //         ...form,
    //         customer_id: selectedCustomerId,
    //         order_ids: Array.from(selectedContainers),
    //     });
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.terbilang) {
            setErrors({ terbilang: ['Terbilang harus diisi'] });
            alert('Terbilang harus diisi');
            return;
        }

        // susun daftar qty additional untuk order_item yang dipilih
        const selected = orders.find((o) => o.id.toString() === selectedOrderId);
        const additionalSelections =
            selected?.order_items
                .filter((it) => selectedContainers.has(it.id))
                .flatMap((it) =>
                    (it.additional_products ?? []).map((ap) => ({
                        order_item_id: it.id,
                        additional_product_id: ap.id,
                        quantity: addQty[`${it.id}:${ap.id}`] ?? 1,
                    })),
                ) ?? [];

        try {
            await router.post('/invoices/preview', {
                ...form,
                customer_id: selectedCustomerId,
                order_id: selectedOrderId,
                order_ids: [selectedOrderId],
                order_item_ids: Array.from(selectedContainers),
                additional_product_quantities: additionalSelections, // NEW
                applyMaterai: form.applyMaterai,
            });
        } catch (err: unknown) {
            const error = err as AxiosErrorResponse; // casting aman karena kita punya tipe

            if (error.response?.status === 422) {
                setErrors(error.response.data?.errors ?? {});
                setGeneralError('Terjadi kesalahan saat menyimpan invoice. Silakan coba lagi nanti.');
            } else {
                alert('Terjadi kesalahan saat menyimpan invoice.');
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Invoice" />
            <InvoicesLayout>
                <div className="mx-auto max-w-4xl space-y-6">
                    <Heading title="Create Invoice" description="Pilih customer dan kontainer untuk membuat invoice." />

                    {generalError && (
                        <div className="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                            <strong className="font-bold">Error:</strong>
                            <span className="mt-1 block text-sm">{generalError}</span>
                        </div>
                    )}

                    {/* Error Messages */}
                    {Object.keys(errors).length > 0 && (
                        <div className="relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
                            <strong className="font-bold">Terjadi Kesalahan:</strong>
                            <ul className="mt-2 list-disc pl-5">
                                {Object.entries(errors).map(([field, messages]) =>
                                    messages.map((message: string, index: number) => (
                                        <li key={`${field}-${index}`} className="text-sm">
                                            {message}
                                        </li>
                                    )),
                                )}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Invoice Number */}
                        <div className="space-y-2">
                            <Label htmlFor="invoice_number">Nomor Invoice</Label>
                            <Input name="invoice_number" value={form.invoice_number} readOnly className="bg-gray-100" />
                        </div>

                        {/* Customer Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="customer">Customer</Label>
                            <Dropdown
                                value={selectedCustomerId}
                                options={customers.map((c) => ({
                                    label: c.name,
                                    value: c.id.toString(),
                                }))}
                                onChange={(e) => handleCustomerChange(e.value)}
                                placeholder="Pilih atau cari customer..."
                                filter
                                filterPlaceholder="Cari customer..."
                                showClear
                                className="w-full"
                                emptyMessage="Tidak ada customer ditemukan."
                            />
                        </div>

                        {/* Pilih Order/AJU setelah customer dipilih */}
                        {selectedCustomerId && (
                            <div className="space-y-2">
                                <Label htmlFor="order">Nomor Order/AJU</Label>
                                <Dropdown
                                    value={selectedOrderId}
                                    options={orders.map((o) => ({
                                        label: `Order #${o.order_id} (${o.container_number})`,
                                        value: o.id.toString(),
                                    }))}
                                    onChange={(e) => handleOrderChange(e.value)}
                                    placeholder="Pilih atau cari nomor order/AJU..."
                                    filter
                                    filterPlaceholder="Cari order..."
                                    showClear
                                    className="w-full"
                                    emptyMessage="Tidak ada order tersedia."
                                    disabled={!selectedCustomerId}
                                />
                            </div>
                        )}

                        {/* Daftar Kontainer muncul setelah order dipilih */}
                        {selectedOrderId && (
                            <div className="space-y-2">
                                <Label>Nomor Kontainer</Label>
                                <div className="space-y-3 rounded-md border p-4">
                                    {orders
                                        .filter((order) => order.id.toString() === selectedOrderId)
                                        .flatMap(
                                            (order) =>
                                                order.order_items?.map((item) => {
                                                    console.log('[DEBUG] Additional Products:', item.additional_products);
                                                    const priceValue = Number(item.price_value || 0);

                                                    return (
                                                        <div key={item.id} className="mb-2 space-y-2 border-b pb-2">
                                                            <div className="flex items-center gap-4">
                                                                <input
                                                                    type="checkbox"
                                                                    disabled={disabledOrders.has(item.id)}
                                                                    onChange={(e) => handleContainerCheck(item.id, e.target.checked)}
                                                                    checked={selectedContainers.has(item.id)}
                                                                />

                                                                <label htmlFor={`orderitem-${item.id}`} className="flex-1">
                                                                    <div className="font-medium">{item.container_number}</div>

                                                                    {/* Tampilkan "Sudah pernah dibuat" jika disabled */}
                                                                    {disabledOrders.has(item.id) && (
                                                                        <span className="ml-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                                                                            Sudah pernah dibuat
                                                                        </span>
                                                                    )}

                                                                    <div className="text-sm text-gray-500">
                                                                        {/* Nama produk utama */}
                                                                        {item.product?.service_type ?? '-'}
                                                                    </div>
                                                                </label>
                                                                <div className="w-32 text-right">Rp {priceValue.toLocaleString('id-ID')}</div>
                                                            </div>

                                                            {/* Additional Products */}
                                                            {item.additional_products && item.additional_products.length > 0 && (
                                                                <div className="ml-6 gap-5 space-y-1 pt-3 text-xs text-gray-500 italic">
                                                                    <span className="mt-3">Additional Product:</span>

                                                                    {item.additional_products.map((prod) => {
                                                                        const price = Number(prod.pivot?.price_value || 0);
                                                                        const qty = getQty(item.id, prod.id); // NEW
                                                                        const lineTotal = price * qty; // NEW
                                                                        return (
                                                                            <div
                                                                                key={prod.id}
                                                                                className="mt-2 flex items-center justify-between gap-3"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <span>
                                                                                        • {prod.service_type || `Produk Tambahan #${prod.id}`}
                                                                                    </span>

                                                                                    {/* Input Qty */}
                                                                                    <div className="flex items-center gap-1 not-italic">
                                                                                        <label className="text-[11px] text-gray-600">Qty</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            min={1}
                                                                                            step={1}
                                                                                            value={qty}
                                                                                            onChange={(e) =>
                                                                                                setQty(item.id, prod.id, Number(e.target.value))
                                                                                            } // NEW
                                                                                            className="h-7 w-16 rounded border px-2 text-xs"
                                                                                            disabled={!selectedContainers.has(item.id)} // opsional
                                                                                        />
                                                                                    </div>
                                                                                </div>

                                                                                {/* Harga x Qty = Line Total */}
                                                                                <div className="text-right">
                                                                                    <div>Rp {price.toLocaleString('id-ID')}</div>
                                                                                    <div className="text-[11px] text-gray-600">
                                                                                        × {qty} ={' '}
                                                                                        <span className="font-medium">
                                                                                            Rp {lineTotal.toLocaleString('id-ID')}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }) ?? [],
                                        )}
                                </div>
                            </div>
                        )}

                        {/* Periode Layanan */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="period_start">Periode Mulai</Label>
                                <Input
                                    id="period_start"
                                    name="period_start"
                                    type="date"
                                    value={form.period_start}
                                    onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="period_end">Periode Akhir</Label>
                                <Input
                                    id="period_end"
                                    name="period_end"
                                    type="date"
                                    value={form.period_end}
                                    onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Hidden Input untuk terbilang */}
                        <Input name="terbilang" value={form.terbilang} type="hidden" />

                        {/* Total */}
                        <div className="space-y-2">
                            <Label>Subtotal</Label>
                            <Input
                                name="subtotal"
                                value={isNaN(form.subtotal) ? '0' : `Rp ${form.subtotal.toLocaleString('id-ID')}`}
                                readOnly
                                className="bg-gray-100"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>PPN (11%)</Label>
                            <Input name="ppn" value={`Rp ${form.ppn.toLocaleString('id-ID')}`} readOnly className="bg-gray-100" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Materai</Label>
                                <Input
                                    name="materai"
                                    value={`Rp ${form.materai.toLocaleString('id-ID')}`}
                                    readOnly
                                    disabled={!form.applyMaterai}
                                    className={`bg-gray-100 ${!form.applyMaterai ? 'opacity-50' : ''}`}
                                />
                            </div>

                            {/* Opsi Materai */}
                            <div className="mt-4 flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="applyMaterai"
                                    checked={form.applyMaterai}
                                    onChange={(e) => {
                                        const isChecked = e.target.checked;
                                        setForm((prev) => ({
                                            ...prev,
                                            applyMaterai: isChecked,
                                            materai: isChecked ? 10000 : 0,
                                        }));
                                    }}
                                />
                                <label htmlFor="applyMaterai" className="text-sm font-medium">
                                    Terapkan Materai (Rp 10.000)
                                </label>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Grand Total</Label>
                            <Input name="grand_total" value={`Rp ${form.grand_total.toLocaleString()}`} readOnly className="bg-gray-100" />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" asChild>
                                <Link href="/invoices">Batal</Link>
                            </Button>
                            <Button type="submit" disabled={!selectedCustomerId || !selectedOrderId || selectedContainers.size === 0}>
                                Simpan Invoice
                            </Button>
                        </div>
                    </form>
                </div>
            </InvoicesLayout>
        </AppLayout>
    );
}

// Breadcrumbs
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Invoice',
        href: '/invoices',
    },
    {
        title: 'Create Invoice',
        href: '/invoices/create',
    },
];
