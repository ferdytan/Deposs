import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { Head, useForm } from '@inertiajs/react';
import { Separator } from '@radix-ui/react-select';
import axios from 'axios';
import { PlusCircle, Trash2, X } from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';
import { useEffect, useRef, useState } from 'react';
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
    temps: { [hour: string]: string };
}
interface OrderItemData {
    // Struktur data yang dikirim/diterima dari server untuk tiap order item
    id: number;
    product_id: number;
    container_number: string;
    entry_date: string;
    eir_date: string;
    exit_date: string;
    commodity: string;
    country: string;
    vessel?: string;
    price_type?: '20ft' | '40ft' | 'global';
    price_value?: string | number;
    // Relasi tambahan:
    additional_products: { id: number }[]; // daftar produk tambahan (hanya id relevan)
    rekam_suhu: { tanggal: string; jam_data: { [hour: string]: string } }[];
}

interface OrderProps {
    id: number;
    order_id: string;
    customer_id: number;
    shipper_id: number;
    no_aju: string | null;
    fumigasi: string | null; // ✅ Tambahkan
    items: OrderItemData[];
}

interface PageProps {
    order: OrderProps;
    customers: Customer[];
    shippers: Shipper[];
}

type PriceType = '20ft' | '40ft' | 'global' | undefined;

export default function EditOrder({ order, customers, shippers }: PageProps) {
    // ======================
    //  Inertia Form State
    // ======================
    // Siapkan data awal form dari prop `order`
    const initialOrderItems = order.items.map((item) => {
        // Bentuk struktur OrderItem sesuai kebutuhan form
        const temperatureObj: { [date: string]: { [hour: string]: string } } = {};
        item.rekam_suhu.forEach((rec) => {
            temperatureObj[rec.tanggal] = rec.jam_data;
        });
        return {
            id: item.id,
            product_id: item.product_id.toString(),
            additional_product_ids: item.additional_products.map((p) => p.id.toString()),
            container_number: item.container_number,
            entry_date: item.entry_date ?? '',
            eir_date: item.eir_date ?? '',
            exit_date: item.exit_date ?? '',
            commodity: item.commodity ?? '',
            country: item.country ?? '',
            vessel: item.vessel ?? '',
            price_type: item.price_type ?? undefined,
            price_value: item.price_value ?? undefined,
            temperature: Object.keys(temperatureObj).length ? temperatureObj : undefined,
        };
    });

    const getAdditionalProductPrices = (product_ids: string[], price_type: PriceType, customerProducts: Product[]): string[] => {
        return product_ids.map((id) => {
            const p = customerProducts.find((x) => x.id.toString() === id);
            let price = '0';
            if (p) {
                if (price_type === '20ft') price = p.custom_price_20ft ?? '0';
                else if (price_type === '40ft') price = p.custom_price_40ft ?? '0';
                else price = p.custom_global_price ?? '0';
            }
            return `${id}:${price}`;
        });
    };

    const { data, setData, put, processing, errors } = useForm<{
        customer_id: string;
        shipper_id: string;
        no_aju: string;
        fumigasi: string | null; // ✅ Tambahkan baris ini
        error?: string;
        order_items: {
            id?: number;
            product_id: string;
            additional_product_ids: string[];
            container_number: string;
            entry_date: string;
            eir_date: string;
            exit_date: string;
            commodity: string;
            country: string;
            vessel: string;
            price_type?: '20ft' | '40ft' | 'global';
            price_value?: string | number;
            temperature?: { [date: string]: { [hour: string]: string } };
            additional_product_prices?: string[];
        }[];
    }>({
        customer_id: order.customer_id.toString(),
        shipper_id: order.shipper_id ? order.shipper_id.toString() : '',
        no_aju: order.no_aju ?? '',
        fumigasi: order.fumigasi ?? null, // ✅ Ambil dari prop `order.Fumigator`
        order_items: initialOrderItems,
    });

    // ==================================
    //  Nomor Order vs Nomor AJU
    // ==================================
    // Tentukan mode awal: jika order punya no_aju (manual), maka useOrderId = false.
    const [useOrderId, setUseOrderId] = useState<boolean>(!order.no_aju);
    // currentOrderId menampung kode Order internal (selalu tersedia dari order.order_id)
    const [currentOrderId] = useState<string>(order.order_id);

    // Jika user beralih ke Nomor Order Otomatis, kosongkan no_aju (supaya tidak terkirim)
    const handleSwitchToOrderId = () => {
        setUseOrderId(true);
        setData('no_aju', ''); // hapus input no_aju jika sebelumnya terisi
    };
    const handleSwitchToNoAju = () => {
        setUseOrderId(false);
        // (tidak perlu mengubah currentOrderId, dan no_aju bisa diisi user)
    };

    // ==================================
    //  Dynamic Order Item Helpers
    // ==================================
    const addOrderItem = () => {
        setData('order_items', [
            ...data.order_items,
            {
                id: undefined, // id undefined menandakan item baru
                product_id: '',
                additional_product_ids: [],
                container_number: '',
                entry_date: '',
                eir_date: '',
                exit_date: '',
                commodity: '',
                country: '',
                vessel: '',
                price_type: undefined,
                price_value: undefined,
                temperature: undefined,
            },
        ]);
    };

    const removeOrderItem = (index: number) => {
        setData(
            'order_items',
            data.order_items.filter((_, i) => i !== index),
        );
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateOrderItem = (index: number, field: keyof (typeof data.order_items)[number], value: any) => {
        const newItems = [...data.order_items];
        // @ts-expect-error – dynamic field assignment, may cause type conflict
        newItems[index][field] = value;

        // Jika field yang diubah adalah price_type, otomatis atur price_value sesuai produk terpilih
        if (field === 'price_type') {
            const selectedProduct = getSelectedProduct(newItems[index].product_id);
            let price_value;
            if (selectedProduct) {
                if (value === '20ft') price_value = selectedProduct.custom_price_20ft;
                else if (value === '40ft') price_value = selectedProduct.custom_price_40ft;
                else price_value = selectedProduct.custom_global_price;
            }
            newItems[index]['price_value'] = price_value;

            // ⬇️ recompute additional prices mengikuti price_type baru
            const addIds = (newItems[index].additional_product_ids || []) as string[];
            newItems[index]['additional_product_prices'] = getAdditionalProductPrices(
                addIds,
                value as '20ft' | '40ft' | 'global' | undefined,
                customerProducts,
            );
        }

        setData('order_items', newItems);
    };

    const hasDuplicateContainer = (index: number) => {
        const current = data.order_items[index].container_number.trim().toUpperCase();
        return data.order_items.some((item, i) => i !== index && item.container_number.trim().toUpperCase() === current && current.length > 0);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error sebelumnya
        setData('error', undefined);

        // Validasi: Jika fumigasi diisi, maka shipper_id wajib diisi
        if (data.fumigasi && data.fumigasi.trim() !== '' && !data.shipper_id) {
            setData('error', 'Shipper wajib diisi karena catatan Fumigator diisi.');
            return;
        }

        // Submit jika lolos validasi
        put(route('orders.update', order.id));
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
            // convert nested object to TemperatureRecord[]
            const records: TemperatureRecord[] = Object.entries(prev).map(([date, temps]) => ({ date, temps }));
            setTempRecords(records);
        } else {
            // default: one empty record (today's date)
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
        // Reset modal state
        setIsTempDialogOpen(false);
        setTempOrderIndex(null);
        setTempRecords([]);
    };

    // ==================================
    //  Fetch Products per Customer
    // ==================================
    const [customerProducts, setCustomerProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const initialLoad = useRef(true);

    useEffect(() => {
        if (data.customer_id) {
            setProductsLoading(true);
            axios
                .get(`/api/customers/${data.customer_id}/products`)
                .then((res) => {
                    setCustomerProducts(res.data);
                    // Reset field produk jika ganti customer (tidak pada load awal)
                    if (!initialLoad.current) {
                        setData(
                            'order_items',
                            data.order_items.map((item) => ({
                                ...item,
                                product_id: '',
                                additional_product_ids: [],
                                price_type: undefined,
                                price_value: undefined,
                            })),
                        );
                    }
                    initialLoad.current = false;
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
                    price_value: undefined,
                })),
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.customer_id]);

    const getSelectedProduct = (productId: string) => customerProducts.find((p) => p.id === Number(productId));

    // ==================================
    //  Render JSX
    // ==================================
    return (
        <AppLayout>
            <Head title="Edit Order" />
            <OrdersLayout>
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Edit Order</h2>

                    {errors.error && <div className="mb-2 rounded bg-red-100 px-4 py-2 text-sm text-red-700">{errors.error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Jenis Nomor Order (Order ID vs No AJU) */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <Label>Jenis Nomor Order</Label>
                                <div className="mt-5 flex flex-row gap-6">
                                    <div className="flex items-center gap-2">
                                        <Input type="radio" checked={useOrderId} onChange={handleSwitchToOrderId} />
                                        <Label>Nomor Order Otomatis</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input type="radio" checked={!useOrderId} onChange={handleSwitchToNoAju} />
                                        <Label>Nomor AJU</Label>
                                    </div>
                                </div>
                            </div>
                            {useOrderId ? (
                                <div className="space-y-2">
                                    <Label>Nomor Order</Label>
                                    {/* Tampilkan kode Order (read-only) */}
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
                                    {errors.no_aju && <p className="text-sm text-red-500">{errors.no_aju}</p>}
                                </div>
                            )}
                        </div>

                        {/* Customer & Shipper */}
                        {/* Customer & Shipper */}
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                    showClear
                                    onChange={(e) => setData('customer_id', e.value)}
                                    className="w-full"
                                    disabled={processing} // disable saat loading
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
                                    showClear
                                    onChange={(e) => setData('shipper_id', e.value)}
                                    className="w-full"
                                    disabled={processing}
                                />
                                {errors.shipper_id && <p className="mt-1 text-sm text-red-500">{errors.shipper_id}</p>}
                            </div>

                            {/* Fumigator - Free Text */}
                            <div className="space-y-2">
                                <Label>Fumigator</Label>
                                <textarea
                                    value={data.fumigasi ?? ''}
                                    onChange={(e) => setData('fumigasi', e.target.value)}
                                    placeholder="Masukkan catatan Fumigator (opsional)..."
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={3}
                                    disabled={processing}
                                />
                                {errors.fumigasi && <p className="mt-1 text-sm text-red-500">{errors.fumigasi}</p>}
                            </div>
                        </div>

                        {/* Daftar Order Items */}
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
                                // const isExistingItem = item.id !== undefined && item.id !== null;
                                const hasTempData = Object.keys(item.temperature ?? {}).length > 0;

                                return (
                                    <div>
                                        <div key={idx} className="space-y-4 rounded-lg border p-4">
                                            <div className="flex flex-wrap gap-4">
                                                {/* Produk */}
                                                {/* Produk */}
                                                <div className="min-w-[200px] flex-1">
                                                    <Label>Produk</Label>
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
                                                        showClear
                                                        onChange={(e) => {
                                                            updateOrderItem(idx, 'product_id', e.value);
                                                            updateOrderItem(idx, 'price_type', undefined);
                                                        }}
                                                        disabled={!data.customer_id || productsLoading}
                                                        className="w-full"
                                                    />
                                                </div>
                                                {/* Harga */}
                                                <div className="min-w-[160px] flex-1">
                                                    <Label>Pilih Harga</Label>
                                                    <Select
                                                        value={item.price_type}
                                                        disabled={
                                                            !item.product_id || priceOptions.length === 0
                                                            // || isExistingItem
                                                        }
                                                        onValueChange={(val) => updateOrderItem(idx, 'price_type', val as '20ft' | '40ft' | 'global')}
                                                    >
                                                        <SelectTrigger>
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
                                                    {item.price_type && item.price_value && (
                                                        <div className="mt-1 text-sm text-gray-700">
                                                            Harga dipilih: Rp{Number(item.price_value).toLocaleString()}
                                                        </div>
                                                    )}
                                                    {priceOptions.length === 0 && (
                                                        <div className="mt-1 text-sm text-red-500">Tidak ada harga untuk produk ini</div>
                                                    )}
                                                </div>
                                                {/* Additional Products (Checkbox List) */}
                                                <div className="min-w-[200px] flex-1">
                                                    <Label>Additional Produk</Label>
                                                    <div className="max-h-32 overflow-y-auto rounded border px-2 py-1">
                                                        {customerProducts.map((p) => (
                                                            <div key={p.id} className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.additional_product_ids?.includes(p.id.toString()) || false}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        const val = p.id.toString();
                                                                        let next = item.additional_product_ids?.slice() || [];

                                                                        if (checked) {
                                                                            if (!next.includes(val)) next.push(val);
                                                                        } else {
                                                                            next = next.filter((v) => v !== val);
                                                                        }

                                                                        updateOrderItem(idx, 'additional_product_ids', next);
                                                                        updateOrderItem(
                                                                            idx,
                                                                            'additional_product_prices',
                                                                            getAdditionalProductPrices(
                                                                                next,
                                                                                data.order_items[idx].price_type,
                                                                                customerProducts,
                                                                            ),
                                                                        );
                                                                    }}
                                                                    disabled={
                                                                        productsLoading || !data.customer_id || p.id.toString() === item.product_id // ⬅️ sama di sini
                                                                    }
                                                                />

                                                                <label>{p.service_type}</label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Nomor Kontainer */}
                                                <div className="min-w-[200px] flex-1">
                                                    <Label>Nomor Kontainer</Label>
                                                    <Input
                                                        value={item.container_number}
                                                        onChange={(e) => updateOrderItem(idx, 'container_number', e.target.value.toUpperCase())}
                                                        placeholder="EMCU1234567"
                                                        maxLength={11}
                                                        // disabled={isExistingItem} // kontainer tidak dapat diubah untuk item lama
                                                    />
                                                    {hasDuplicateContainer(idx) && (
                                                        <p className="text-sm text-red-500">Nomor kontainer sudah dipakai</p>
                                                    )}
                                                </div>
                                                {/* Rekam Suhu */}
                                                {requiresTemp && (
                                                    <div className="flex items-end">
                                                        <div>
                                                            <Button type="button" variant="outline" onClick={() => openTempModal(idx)}>
                                                                Rekam Suhu
                                                            </Button>
                                                            {hasTempData ? (
                                                                <p className="mt-1 text-xs text-green-600">Data suhu telah tercatat.</p>
                                                            ) : (
                                                                <p className="mt-1 text-xs text-gray-600">Produk ini memerlukan rekaman suhu.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Detail Tambahan: Entry, EIR, Exit, Commodity, Country, Vessel */}
                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div>
                                                    <Label>Country</Label>
                                                    <Input
                                                        value={item.country}
                                                        onChange={(e) => updateOrderItem(idx, 'country', e.target.value)}
                                                        placeholder="Negara tujuan"
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Nama Kapal (Vessel)</Label>
                                                    <Input
                                                        value={item.vessel || ''}
                                                        onChange={(e) => updateOrderItem(idx, 'vessel', e.target.value)}
                                                        placeholder="Nama Kapal"
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal Masuk</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.entry_date}
                                                        onChange={(e) => updateOrderItem(idx, 'entry_date', e.target.value)}
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal EIR</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.eir_date}
                                                        onChange={(e) => updateOrderItem(idx, 'eir_date', e.target.value)}
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Tanggal Keluar</Label>
                                                    <Input
                                                        type="datetime-local"
                                                        value={item.exit_date}
                                                        onChange={(e) => updateOrderItem(idx, 'exit_date', e.target.value)}
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Komoditi</Label>
                                                    <Input
                                                        value={item.commodity}
                                                        onChange={(e) => updateOrderItem(idx, 'commodity', e.target.value)}
                                                        placeholder="Contoh: Barang Elektronik"
                                                        // disabled={isExistingItem}
                                                    />
                                                </div>
                                            </div>

                                            {/* Tombol Remove Item (hanya tampil jika lebih dari 1 item atau item baru) */}
                                            <div className="flex justify-end">
                                                <Button type="button" variant="destructive" size="icon" onClick={() => removeOrderItem(idx)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Separator className="mt-5" />
                                    </div>
                                );
                            })}
                            <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
                                <PlusCircle className="mr-1 h-4 w-4" /> Tambah Layanan
                            </Button>
                        </div>

                        {/* Hidden Inputs (untuk mengirim data kompleks) */}
                        {useOrderId && <input type="hidden" name="order_id" value={currentOrderId} />}
                        <input type="hidden" name="order_items" value={JSON.stringify(data.order_items)} />

                        {/* Dialog Rekam Suhu */}
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
                                                        <Label htmlFor={`temp_${rIdx}_${h}`}>
                                                            {h.toString().padStart(2, '0')}
                                                            :00
                                                        </Label>
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

                        {/* Tombol Submit */}
                        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                            {/* Tombol Hapus Order */}
                            {/* <Button
                                type="button"
                                variant="destructive"
                                onClick={() => {
                                    if (confirm('Apakah Anda yakin ingin menghapus order ini?')) {
                                        router.delete(route('orders.destroy', order.id));
                                    }
                                }}
                            >
                                Hapus Order
                            </Button> */}
                            {/* Tombol Simpan Perubahan */}
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                {processing && <span className="mr-2 animate-spin">●</span>}
                                {processing ? 'Memproses...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}
