import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { useEffect, useState } from 'react';

// =====================
//  Tipe Data
// =====================
interface Customer {
    id: number;
    name: string;
}

interface Product {
    id: number;
    service_type: string;
    requires_temperature: boolean;
    custom_price_20ft?: string;
    custom_price_40ft?: string;
    custom_global_price?: string;
}

interface Shipper {
    id: number;
    name: string;
}

interface TemperatureRecord {
    date: string; // YYYY-MM-DD
    temps: { [hour: string]: string }; // e.g. { '00': '-18', '01': '-17.5', ... }
}

interface OrderItem {
    product_id: string;
    additional_product_ids?: string[];
    container_number: string;
    entry_date: string;
    eir_date: string;
    exit_date: string;
    commodity: string;
    country: string;
    vessel?: string; // Tambahkan baris ini
    /**
     * Struktur baru:
     * {
     *   '2025-07-10': { '00': '-18', '01': '-17.5', ... },
     *   '2025-07-11': { '00': '-18', ... }
     * }
     */
    temperature?: { [date: string]: { [hour: string]: string } };
    price_type?: '20ft' | '40ft' | 'global';
    price_value?: string | number | undefined;
    [key: string]: string | string[] | { [date: string]: { [hour: string]: string } } | number | undefined;
    additional_product_prices?: string[]; // Format: ["3:150000", "5:220000"]
}

interface PageProps {
    customers: Customer[];
    products: Product[]; // not directly used; fetched per‑customer
    shippers: Shipper[];
    order_id?: string;
}

export default function CreateOrderWithMultiTemp({ customers, shippers, order_id }: PageProps) {
    // ==================================
    //  State Inertia Form
    // ==================================
    const { data, setData, post, processing, errors } = useForm<{
        customer_id: string;
        shipper_id: string;
        entry_date: string;
        eir_date: string;
        exit_date: string;
        commodity: string;
        no_aju: string;
        fumigasi: string | null; // ✅ string atau null
        order_items: OrderItem[];
        error?: string;
    }>({
        customer_id: '',
        shipper_id: '',
        entry_date: '',
        eir_date: '',
        exit_date: '',
        commodity: '',
        no_aju: '',
        fumigasi: null, // bisa null, nanti di textarea jadi ''
        order_items: [
            {
                product_id: '',
                additional_product_ids: [],
                container_number: '',
                entry_date: '',
                eir_date: '',
                exit_date: '',
                commodity: '',
                country: '',
            },
        ],
    });

    // ==================================
    //  Nomor Order / AJU
    // ==================================
    const [useOrderId, setUseOrderId] = useState<boolean>(true);
    const [currentOrderId, setCurrentOrderId] = useState<string>(order_id || '');

    useEffect(() => {
        if (useOrderId && !currentOrderId) {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            setCurrentOrderId(`ORD-${today}-XXXX`);
        }
    }, [useOrderId, currentOrderId]);

    // ==================================
    //  Dynamic Order Item helpers
    // ==================================
    const addOrderItem = () => {
        setData('order_items', [
            ...data.order_items,
            {
                product_id: '',
                additional_product_ids: [],
                container_number: '',
                entry_date: '',
                eir_date: '',
                exit_date: '',
                commodity: '',
                country: '',
                vessel: '', // Tambahkan baris ini
            },
        ]);
    };

    const removeOrderItem = (index: number) => {
        setData(
            'order_items',
            data.order_items.filter((_, i) => i !== index),
        );
    };

    const updateOrderItem = (index: number, field: keyof OrderItem, value: OrderItem[keyof OrderItem]) => {
        const newItems = [...data.order_items];
        // @ts‑ignore – dynamic field access
        newItems[index][field] = value;

        if (field === 'price_type') {
            const selectedProduct = getSelectedProduct(newItems[index].product_id);
            let price_value = undefined;
            if (selectedProduct) {
                if (value === '20ft') price_value = selectedProduct.custom_price_20ft;
                else if (value === '40ft') price_value = selectedProduct.custom_price_40ft;
                else if (value === 'global') price_value = selectedProduct.custom_global_price;
            }
            newItems[index]['price_value'] = price_value;

            // ⬇️ recompute harga additional sesuai price_type baru
            const addIds = (newItems[index].additional_product_ids as string[]) || [];
            newItems[index]['additional_product_prices'] = getAdditionalProductPrices(addIds, value as '20ft' | '40ft' | 'global' | undefined);
        }

        setData('order_items', newItems);
    };

    const hasDuplicateContainer = (index: number) => {
        const current = data.order_items[index].container_number;
        return data.order_items.some((item, i) => i !== index && item.container_number === current && current.length > 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error
        setData('error', undefined);

        // Validasi: Jika field fumigasi diisi (tidak null/undefined/empty), maka shipper_id wajib diisi
        if (data.fumigasi && data.fumigasi.trim() !== '' && !data.shipper_id) {
            setData('error', 'Shipper wajib diisi karena catatan Fumigator diisi.');
            return;
        }

        // Validasi lain (opsional: duplikasi kontainer, dll)
        // const containers = data.order_items.map(i => i.container_number.trim().toUpperCase()).filter(n => n);
        // const hasDup = containers.some((val, i) => containers.indexOf(val) !== i);
        // if (hasDup) {
        //     setData('error', 'Nomor kontainer tidak boleh duplikat.');
        //     return;
        // }

        // Submit jika lolos validasi
        post(route('orders.store'));
    };

    // ==================================
    //  State & UI for Temperature Dialog
    // ==================================
    const [isTempDialogOpen, setIsTempDialogOpen] = useState(false);
    const [tempOrderIndex, setTempOrderIndex] = useState<number | null>(null);
    const [tempRecords, setTempRecords] = useState<TemperatureRecord[]>([]);

    const openTempModal = (index: number) => {
        setTempOrderIndex(index);
        const prev = data.order_items[index]?.temperature;
        if (prev && Object.keys(prev).length > 0) {
            // convert nested object -> TemperatureRecord[]
            const records: TemperatureRecord[] = Object.entries(prev).map(([date, temps]) => ({ date, temps }));
            setTempRecords(records);
        } else {
            // default one empty record
            setTempRecords([
                {
                    date: new Date().toISOString().slice(0, 10),
                    temps: {},
                },
            ]);
        }
        setIsTempDialogOpen(true);
    };

    const updateDate = (recordIdx: number, date: string) => {
        setTempRecords((prev) => {
            const next = [...prev];
            next[recordIdx].date = date;
            return next;
        });
    };

    const updateTemp = (recordIdx: number, hour: number, value: string) => {
        setTempRecords((prev) => {
            const next = [...prev];
            next[recordIdx].temps = {
                ...next[recordIdx].temps,
                [hour.toString().padStart(2, '0')]: value,
            };
            return next;
        });
    };

    const addDateRecord = () => {
        setTempRecords((prev) => [...prev, { date: '', temps: {} }]);
    };

    const removeDateRecord = (recordIdx: number) => {
        setTempRecords((prev) => prev.filter((_, i) => i !== recordIdx));
    };

    const submitTempRecords = () => {
        if (tempOrderIndex === null) return;
        const formatted: { [date: string]: { [hour: string]: string } } = {};
        tempRecords.forEach((rec) => {
            if (rec.date) {
                formatted[rec.date] = rec.temps;
            }
        });
        const newItems = [...data.order_items];
        newItems[tempOrderIndex] = {
            ...newItems[tempOrderIndex],
            temperature: formatted,
        };
        setData('order_items', newItems);
        // reset modal state
        setIsTempDialogOpen(false);
        setTempOrderIndex(null);
        setTempRecords([]);
    };

    // ==================================
    //  Fetch Products per‑Customer
    // ==================================
    const [customerProducts, setCustomerProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);

    useEffect(() => {
        if (data.customer_id) {
            setProductsLoading(true);
            axios
                .get(`/api/customers/${data.customer_id}/products`)
                .then((res) => {
                    setCustomerProducts(res.data);
                    // reset order items pricing fields when customer changes
                    setData(
                        'order_items',
                        data.order_items.map((item) => ({
                            ...item,
                            product_id: '',
                            additional_product_ids: [],
                            price_type: undefined,
                        })),
                    );
                })
                .finally(() => setProductsLoading(false));
        } else {
            setCustomerProducts([]);
            setData(
                'order_items',
                data.order_items.map((item) => ({
                    ...item,
                    product_id: '',
                    additional_product_ids: [],
                    price_type: undefined,
                })),
            );
        }
        // eslint‑disable‑next‑line react‑hooks/exhaustive‑deps
    }, [data.customer_id]);

    const getSelectedProduct = (product_id: string) => customerProducts.find((p) => p.id === parseInt(product_id));

    // const getAdditionalProductGlobalPrices = (product_ids: string[]): string[] => {
    //     return product_ids.map((id) => {
    //         const product = customerProducts.find((p) => p.id.toString() === id);
    //         return `${id}:${product?.custom_global_price || '0'}`;
    //     });
    // };

    const formatErrorMessage = (key: string, message: string) => {
        // Hilangkan prefix "order_items.X."
        const cleanKey = key.replace(/^order_items\.\d+\./, '');

        // Mapping field ke label yang lebih enak dibaca
        const labelMap: Record<string, string> = {
            customer_id: 'Customer',
            shipper_id: 'Shipper',
            no_aju: 'Nomor AJU',
            product_id: 'Produk',
            container_number: 'Nomor Kontainer',
            entry_date: 'Tanggal Masuk',
            eir_date: 'Tanggal EIR',
            exit_date: 'Tanggal Keluar',
            commodity: 'Komoditi',
            country: 'Negara',
            vessel: 'Nama Kapal',
            price_type: 'Tipe Harga',
            additional_product_ids: 'Produk Tambahan',
            temperature: 'Rekam Suhu',
            order_items: 'Item order',
        };

        // Ambil label, fallback ke capitalize key
        const fieldLabel =
            labelMap[cleanKey] ||
            cleanKey
                .split('_')
                .join(' ')
                .replace(/\b\w/g, (l) => l.toUpperCase());

        // Bersihkan pesan: hilangkan bagian seperti "The order items.0.container number"
        const cleanMessage = message
            .replace(/^The /, '')
            .replace(/ for order items \d+$/, '')
            .replace(/ in order items \d+$/, '')
            .replace(/order_items\.\d+\./g, '')
            .replace(/\.$/, '')
            .trim();

        return `${fieldLabel} ${cleanMessage}`;
    };

    // ganti fungsi lama dengan ini
    const getAdditionalProductPrices = (product_ids: string[], price_type?: '20ft' | '40ft' | 'global'): string[] => {
        return product_ids.map((id) => {
            const product = customerProducts.find((p) => p.id.toString() === id);
            let price = '0';
            if (product) {
                if (price_type === '20ft') price = product.custom_price_20ft ?? '0';
                else if (price_type === '40ft') price = product.custom_price_40ft ?? '0';
                else price = product.custom_global_price ?? '0';
            }
            return `${id}:${price}`;
        });
    };

    // ==================================
    //  Render
    // ==================================

    const handleDropdownShow = () => {
    setTimeout(() => {
        const input = document.querySelector('.p-dropdown-panel .p-inputtext');
        if (input) input.focus();
    }, 100);
    };

    return (
        <AppLayout>
            <Head title="Buat Order Baru" />
            <OrdersLayout>
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Buat Order Baru</h2>

                    {/* Tampilkan semua error sebagai list */}
                    {Object.keys(errors).length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <h3 className="mb-2 text-sm font-semibold text-red-800">Terdapat kesalahan:</h3>
                            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
                                {Object.entries(errors).map(([key, message]) => (
                                    <li key={key}>
                                        {/* Ubah key jadi label yang lebih user-friendly */}
                                        {formatErrorMessage(key, message)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Error Umum */}
                    {data.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-700">{data.error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* --- Jenis Nomor Order (Gaya Baru) --- */}
                        <div className="space-y-4">
                            <div className="flex rounded-md border p-1">
                                <div 
                                    onClick={() => {
                                        setUseOrderId(true);
                                        setData('no_aju', '');
                                    }}
                                    className={`flex-1 cursor-pointer rounded-md p-2 text-center text-sm font-semibold transition-colors ${useOrderId ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-700'}`}
                                >
                                    Nomor Order Otomatis
                                </div>
                                <div 
                                    onClick={() => setUseOrderId(false)}
                                    className={`flex-1 cursor-pointer rounded-md p-2 text-center text-sm font-semibold transition-colors ${!useOrderId ? 'bg-blue-500 text-white' : 'bg-transparent text-gray-700'}`}
                                >
                                    Nomor AJU
                                </div>
                            </div>

                            {useOrderId ? (
                                <div className="space-y-2">
                                    <Label>Nomor Order</Label>
                                    <Input value={currentOrderId} readOnly className="cursor-not-allowed bg-gray-100" />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label>Nomor AJU</Label>
                                    <Input
                                        value={data.no_aju}
                                        onChange={(e) => setData('no_aju', e.target.value)}
                                        placeholder="Masukkan Nomor AJU"
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Customer & Shipper */}
                        {/* Customer & Shipper */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {/* Customer */}
                            <div className="space-y-2">
                                <Label>Pilih Customer</Label>
                                <Dropdown
                                    value={data.customer_id}
                                    options={customers.map((c) => ({
                                        label: c.name,
                                        value: c.id.toString(),
                                    }))}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Pilih atau cari Customer"
                                    filter
                                    filterPlaceholder="Cari customer..."
                                    showClear={false}
                                    onChange={(e) => setData('customer_id', e.value)}
                                    onShow={handleDropdownShow} // ⬅️ Tambahkan ini
                                    className="w-full rounded-md border border-gray-300 h-10 px-3 py-2"
                                />
                                {errors.customer_id && <p className="mt-1 text-sm text-red-500">{errors.customer_id}</p>}
                            </div>

                            {/* Shipper */}
                            <div className="space-y-2">
                                <Label>Pilih Shipper</Label>
                                <Dropdown
                                    value={data.shipper_id}
                                    options={shippers.map((s) => ({
                                        label: s.name,
                                        value: s.id.toString(),
                                    }))}
                                    optionLabel="label"
                                    optionValue="value"
                                    placeholder="Pilih atau cari Shipper"
                                    filter
                                    filterPlaceholder="Cari shipper..."
                                    showClear={true}
                                    onChange={(e) => setData('shipper_id', e.value)}
                                    onShow={handleDropdownShow} // ⬅️ Tambahkan ini
                                    className="w-full rounded-md border border-gray-300 h-10 px-3 py-2"
                                />
                                {errors.shipper_id && <p className="mt-1 text-sm text-red-500">{errors.shipper_id}</p>}
                            </div>

                            {/* Fumigator - Free Text */}
                            <div className="space-y-2">
                                <Label>Fumigator (Catatan)</Label>
                                <input
                                    value={data.fumigasi ?? ''}
                                    onChange={(e) => setData('fumigasi', e.target.value)}
                                    placeholder="Masukkan catatan Fumigator (opsional)..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={3}
                                />
                                {errors.fumigasi && <p className="mt-1 text-sm text-red-500">{errors.fumigasi}</p>}
                            </div>
                        </div>

                        {/* Dynamic Order Items */}
                        <div className="space-y-4">
                            <Label>Layanan & Nomor Kontainer</Label>
                            {data.order_items.map((item, idx) => {
                                const product = getSelectedProduct(item.product_id);
                                const requiresTemp = product?.requires_temperature || false;
                                const priceOptions = [
                                    {
                                        label: 'Harga 20ft',
                                        value: '20ft',
                                        price: product?.custom_price_20ft,
                                    },
                                    {
                                        label: 'Harga 40ft',
                                        value: '40ft',
                                        price: product?.custom_price_40ft,
                                    },
                                    {
                                        label: 'Harga Global',
                                        value: 'global',
                                        price: product?.custom_global_price,
                                    },
                                ].filter((o) => o.price !== undefined && o.price !== null);

                                return (
                                    <div>
                                        <div key={idx} className="space-y-4 rounded-lg border p-4 mb-6">
                                            <div className="flex flex-wrap gap-4">
                                                {/* Produk */}
                                                <div className="min-w-[200px] flex-1">
                                                    <Label className="text-base font-bold">Produk #{idx + 1}</Label>
                                                    <Dropdown
                                                        value={item.product_id}
                                                        options={customerProducts.map((p) => ({
                                                            label: p.service_type,
                                                            value: p.id.toString(),
                                                        }))}
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        placeholder={productsLoading ? 'Memuat...' : 'Pilih Layanan'}
                                                        filter
                                                        filterPlaceholder="Cari layanan..."
                                                        showClear={false}
                                                        onChange={(e) => {
                                                            updateOrderItem(idx, 'product_id', e.value);
                                                            updateOrderItem(idx, 'price_type', undefined);
                                                        }}
                                                        disabled={!data.customer_id || productsLoading}
                                                        className="w-full rounded-md border border-gray-300 h-10 px-3 py-2"
                                                    />
                                                </div>
                                                {/* Harga */}
                                                <div className="min-w-[160px] flex-1">
                                                    <Label>Pilih Harga</Label>
                                                    <Select
                                                        value={item.price_type}
                                                        onValueChange={(val) => updateOrderItem(idx, 'price_type', val as '20ft' | '40ft' | 'global')}
                                                        disabled={!item.product_id || priceOptions.length === 0}
                                                    >
                                                        <SelectTrigger className="h-10 px-3 py-2 font-sans">
                                                            <SelectValue placeholder="Pilih Harga" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {priceOptions.map((o) => (
                                                                <SelectItem key={o.value} value={o.value}>
                                                                    {o.label} {o.price ? `: Rp${Number(o.price).toLocaleString()}` : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    {priceOptions.length === 0 && (
                                                        <div className="mt-1 text-sm text-red-500">Tidak ada harga untuk produk ini</div>
                                                    )}
                                                </div>
                                                {/* Additional Product Multi‑Select */}
                                                <div className="min-w-[200px] flex-1">
                                                    <Label>Additional Produk</Label>
                                                    <MultiSelect
                                                        value={item.additional_product_ids || []}
                                                        options={customerProducts.map((p) => ({
                                                            label: p.service_type,
                                                            value: p.id.toString(),
                                                            disabled: p.id.toString() === item.product_id, // disable jika sama dengan produk utama
                                                        }))}
                                                        onChange={(e) => {
                                                            const next = e.value;
                                                            updateOrderItem(idx, 'additional_product_ids', next);

                                                            // Generate harga tambahan
                                                            const additionalPrices = getAdditionalProductPrices(next, item.price_type);
                                                            updateOrderItem(idx, 'additional_product_prices', additionalPrices);
                                                        }}
                                                        optionLabel="label"
                                                        optionValue="value"
                                                        placeholder="Pilih produk tambahan"
                                                        disabled={productsLoading || !data.customer_id}
                                                        display="chip"
                                                        className="w-full rounded-md border border-gray-300 h-10 px-2 py-1"
                                                    />
                                                </div>
                                                {/* Container */}
                                                <div className="flex-1">
                                                    <Label>Nomor Kontainer</Label>
                                                    <div className="flex w-full gap-2">
                                                        <Input
                                                            className="flex-1"
                                                            value={item.container_number}
                                                            onChange={(e) => updateOrderItem(idx, 'container_number', e.target.value.toUpperCase())}
                                                            placeholder="EMCU1234567"
                                                            maxLength={11}
                                                        />
                                                        {requiresTemp && (
                                                            <Button type="button" variant="outline" onClick={() => openTempModal(idx)}>
                                                                Rekam Suhu
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {hasDuplicateContainer(idx) && (
                                                        <p className="text-sm text-red-500">Nomor kontainer sudah dipakai</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Date, Entry, EIR, Exit, Commodity, Country */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <Label>Negara</Label>
                                                    <Input
                                                        value={item.country}
                                                        onChange={(e) => updateOrderItem(idx, 'country', e.target.value)}
                                                        placeholder="Negara Asal / tujuan"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Nama Kapal (Vessel)</Label>
                                                    <Input
                                                        value={item.vessel || ''}
                                                        onChange={(e) => updateOrderItem(idx, 'vessel', e.target.value)}
                                                        placeholder="Nama Kapal"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Komoditi</Label>
                                                    <Input
                                                        value={item.commodity}
                                                        onChange={(e) => updateOrderItem(idx, 'commodity', e.target.value)}
                                                        placeholder="Contoh: Barang Elektronik"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal Masuk</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.entry_date}
                                                        onChange={(e) => updateOrderItem(idx, 'entry_date', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal EIR</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.eir_date}
                                                        onChange={(e) => updateOrderItem(idx, 'eir_date', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal Keluar</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.exit_date}
                                                        onChange={(e) => updateOrderItem(idx, 'exit_date', e.target.value)}
                                                    />
                                                </div>
                                                
                                            </div>
                                            {/* Remove Item */}
                                            {data.order_items.length > 1 && (
                                                <div className="flex justify-end">
                                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeOrderItem(idx)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <Separator className="my-6" />
                                    </div>
                                );
                            })}
                            <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                                + Tambah Layanan
                            </Button>
                        </div>

                        {/* Hidden Inputs */}
                        {useOrderId && <input type="hidden" name="order_id" value={currentOrderId} />}
                        <input type="hidden" name="order_items" value={JSON.stringify(data.order_items)} />

                        {/* Temperature Dialog */}
                        <Dialog open={isTempDialogOpen} onOpenChange={setIsTempDialogOpen}>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>Rekam Suhu Kontainer</DialogTitle>
                                </DialogHeader>
                                <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
                                    {tempRecords.map((rec, rIdx) => (
                                        <div key={rIdx} className="space-y-2 rounded border p-4">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`date_${rIdx}`}>Tanggal</Label>
                                                <Input
                                                    id={`date_${rIdx}`}
                                                    type="date"
                                                    value={rec.date}
                                                    onChange={(e) => updateDate(rIdx, e.target.value)}
                                                    className="max-w-[180px]"
                                                />
                                                {tempRecords.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        size="icon"
                                                        variant="destructive"
                                                        className="ml-auto"
                                                        onClick={() => removeDateRecord(rIdx)}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
                                                {[...Array(24)].map((_, h) => (
                                                    <div key={h} className="flex items-center gap-2">
                                                        <Label htmlFor={`temp_${rIdx}_${h}`}>{h.toString().padStart(2, '0')}:00</Label>
                                                        <Input
                                                            id={`temp_${rIdx}_${h}`}
                                                            type="number"
                                                            step="0.1"
                                                            value={rec.temps[h.toString().padStart(2, '0')] || ''}
                                                            onChange={(e) => updateTemp(rIdx, h, e.target.value)}
                                                            className="w-24"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={addDateRecord} className="flex items-center gap-2">
                                        <PlusCircle className="h-4 w-4" /> Tambah Tanggal
                                    </Button>
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="outline" onClick={() => setIsTempDialogOpen(false)}>
                                        Batal
                                    </Button>
                                    <Button onClick={submitTempRecords}>Simpan</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Submit */}
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                            {processing && <span className="mr-2 animate-spin">●</span>}
                            {processing ? 'Memproses...' : 'Buat Order'}
                        </Button>
                    </form>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}
