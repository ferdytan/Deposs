import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, PrinterIcon, X } from 'lucide-react';

// UI Components
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

// Types
interface FlashProps {
    success?: string;
    error?: string;
}

type Props = {
    orders: {
        data: Order[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    customers: Customer[]; // ✅ Sudah benar
    filters: {
        customer: string;
        search?: string;
        trashed?: string;
        sort_by?: string;
        sort_dir?: string;
    };
};

type Customer = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    service_type: string;
    requires_temperature: boolean;
};

type Shipper = {
    id: number;
    name: string;
};

type OrderParent = {
    id: number;
    no_aju: string | null;
    order_id: string;
    customer: Customer;
    shipper: { id: number; name: string };
    fumigasi: string | null; // ✅ Tambahkan baris ini
};

type Order = {
    id: number;
    order_id: string;
    customer_id: number;
    product_id: number;
    shipper_id: number;
    container_number: string;
    order: OrderParent; // ✅ Tambahkan ini!
    entry_date: string | null;
    eir_date: string | null;
    exit_date: string | null;
    price_type: string | null; // ➜ baru
    commodity: string | null;
    no_aju: string | null;
    deleted_reason: string | null;
    deleted_at: string | null;
    customer: Customer;
    product: Product;
    shipper: Shipper;
    // Tambahkan ini:
    temperature?: {
        [date: string]: { [hour: string]: string };
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Order Management',
        href: '/orders',
    },
];

type TemperatureRecord = {
    date: string; // YYYY-MM-DD
    temps: { [hour: string]: string };
};

type PageProps = {
    [key: string]: unknown;
    flash?: FlashProps;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role_id: number; // Tambahkan ini!
        };
    };
};

export default function OrdersIndex({ orders, customers, filters: rawFilters }: Props) {
    const filters = rawFilters || {};
    const [search, setSearch] = useState(filters?.search ?? '');
    const [customerFilter, setCustomerFilter] = useState<string>(filters.customer ?? '');

    const [isTempDialogOpen, setIsTempDialogOpen] = useState(false);
    const [tempOrder, setTempOrder] = useState<Order | null>(null);
    const [tempRecords, setTempRecords] = useState<TemperatureRecord[]>([]);

    const [periodMonth, setPeriodMonth] = useState<string>('');
    const [periodYear, setPeriodYear] = useState<string>('');

    // Di dalam komponen, setelah state
    const filteredOrders = orders.data.filter((order) => {
        const customerName = order.order?.customer?.name ?? '';
        const shipperName = order.order?.shipper?.name ?? '';
        const productService = order.product?.service_type ?? '';
        const container = order.container_number ?? '';

        // Cek search
        const matchesSearch =
            !search ||
            customerName.toLowerCase().includes(search.toLowerCase()) ||
            shipperName.toLowerCase().includes(search.toLowerCase()) ||
            productService.toLowerCase().includes(search.toLowerCase()) ||
            container.toLowerCase().includes(search.toLowerCase());

        // Cek customer
        const matchesCustomer = !customerFilter || customerName === customerFilter;

        // 🔁 Cek periode (bulan & tahun)
        const matchesPeriod = () => {
            if (!periodMonth && !periodYear) return true;

            const datesToCheck = [order.entry_date, order.eir_date, order.exit_date];
            return datesToCheck.some((dateStr) => {
                if (!dateStr) return false;
                const date = new Date(dateStr);
                const month = (date.getMonth() + 1).toString().padStart(2, '0'); // 01-12
                const year = date.getFullYear().toString();

                const matchMonth = !periodMonth || month === periodMonth;
                const matchYear = !periodYear || year === periodYear;

                return matchMonth && matchYear;
            });
        };

        return matchesSearch && matchesCustomer && matchesPeriod();
    });

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
                ...(next[recordIdx].temps || {}),
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

    const handleSaveTemp = () => {
        if (!tempOrder) return;
        const formatted: { [date: string]: { [hour: string]: string } } = {};
        tempRecords.forEach((rec) => {
            if (rec.date) formatted[rec.date] = rec.temps;
        });
        console.log('Data yang dikirim ke backend:', formatted);
        router.patch(
            route('orders.update-temperature', tempOrder.id),
            { temperature: formatted },
            {
                onSuccess: () => {
                    setIsTempDialogOpen(false);
                    setTempOrder(null);
                    setTempRecords([]);
                    router.reload({ only: ['orders'] });
                },
                onError: (errors) => {
                    alert('Terjadi error saat menyimpan data suhu.');
                    console.error(errors);
                },
            },
        );
    };
    useEffect(() => {
        console.log('Semua data orders:', orders.data);
    }, [orders.data]);

    const handlePrint = () => {
        // Re-apply filtering (karena print harus konsisten dengan tampilan)
        const filteredOrders = orders.data.filter((order) => {
            const customerName = order.order?.customer?.name ?? '';
            const shipperName = order.order?.shipper?.name ?? '';
            const productService = order.product?.service_type ?? '';
            const container = order.container_number ?? '';
            const noAju = order.order?.no_aju ?? '';
            const orderId = order.order?.order_id ?? '';

            const matchesSearch =
                !search ||
                customerName.toLowerCase().includes(search.toLowerCase()) ||
                shipperName.toLowerCase().includes(search.toLowerCase()) ||
                productService.toLowerCase().includes(search.toLowerCase()) ||
                container.toLowerCase().includes(search.toLowerCase()) ||
                noAju.toLowerCase().includes(search.toLowerCase()) ||
                orderId.toLowerCase().includes(search.toLowerCase());

            const matchesCustomer = !customerFilter || customerName === customerFilter;

            const matchesPeriod = () => {
                if (!periodMonth && !periodYear) return true;
                const datesToCheck = [order.entry_date, order.eir_date, order.exit_date];
                return datesToCheck.some((dateStr) => {
                    if (!dateStr) return false;
                    const date = new Date(dateStr);
                    const month = (date.getMonth() + 1).toString().padStart(2, '0');
                    const year = date.getFullYear().toString();
                    return (!periodMonth || month === periodMonth) && (!periodYear || year === periodYear);
                });
            };

            return matchesSearch && matchesCustomer && matchesPeriod();
        });

        if (filteredOrders.length === 0) {
            alert('Tidak ada data yang sesuai filter untuk dicetak.');
            return;
        }

        // Format label periode
        const monthName = periodMonth ? new Date(2024, parseInt(periodMonth) - 1).toLocaleString('id-ID', { month: 'long' }) : 'Semua Bulan';
        const yearLabel = periodYear || 'Semua Tahun';
        const periodLabel = `${monthName} ${yearLabel}`;

        const customerLabel = customerFilter ? `Customer: ${customerFilter}` : 'Semua Customer';

        const logoUrl = '/logo.png'; // pastikan path benar

        const img = new Image();
        img.src = logoUrl;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.');
            return;
        }

        printWindow.document.write(`
        <div style="text-align: center; margin-top: 50px; font-family: Arial, sans-serif;">
            Memuat logo...
        </div>
    `);
        printWindow.document.close();

        img.onload = () => {
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Billing Statement</title>
                <style>
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        margin: 20px;
                        color: #333;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        margin-bottom: 20px;
                    }
                    .logo {
                        width: 70px;
                        height: 70px;
                    }
                    .company-info {
                        font-size: 14px;
                    }
                    .company-info strong {
                        font-size: 16px;
                    }
                    .customer-info {
                        margin-top: 10px;
                        font-size: 14px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                        font-size: 12px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 8px 10px;
                        text-align: left;
                    }
                    th {
                        background-color: #f0f0f0;
                        font-weight: 600;
                    }
                    .text-gray-400 {
                        color: #9ca3af;
                    }
                    .bg-yellow-100 {
                        background-color: #fef3c7;
                        padding: 4px 6px;
                        border-radius: 4px;
                        font-size: 11px;
                    }
                    .text-yellow-800 {
                        color: #854d0e;
                    }
                    @media print {
                        @page {
                            margin: 1cm;
                        }
                        body {
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="${logoUrl}" alt="Logo" class="logo">
                    <div class="company-info">
                        <strong>PT. DEPO SUBARAYA SEJAHTERA</strong><br>
                        Tanjung Sadari No. 90<br>
                        Surabaya<br>
                        Jawa Timur - Indonesia
                    </div>
                </div>

                <div class="customer-info">
                    <strong>${customerLabel}</strong><br>
                    <strong>Periode:</strong> ${periodLabel}<br>
                  
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nomor Kontainer</th>
                            <th>Nama Shipper</th>
                            <th>Size</th>
                            <th>Tanggal Masuk</th>
                            <th>Tanggal EIR</th>
                            <th>Tanggal Keluar</th>
                            <th>Komoditi</th>
                            <th>Fumigator</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders
                            .map(
                                (order) => `
                            <tr>
                                <td>${order.container_number}</td>
                                <td>${order.order?.shipper?.name ?? '-'}</td>
                                <td>${order.price_type ?? '-'}</td>
                                <td>${order.entry_date ? new Date(order.entry_date).toLocaleString('id-ID') : '<span class="text-gray-400">–</span>'}</td>
                                <td>${order.eir_date ? new Date(order.eir_date).toLocaleString('id-ID') : '<span class="text-gray-400">–</span>'}</td>
                                <td>${order.exit_date ? new Date(order.exit_date).toLocaleString('id-ID') : '<span class="text-gray-400">–</span>'}</td>
                                <td>${order.commodity ?? '-'}</td>
                                <td>
    ${order.order?.fumigasi ? (order.order.fumigasi.length > 50 ? order.order.fumigasi.substring(0, 50) + '...' : order.order.fumigasi) : '–'}
</td>
                            </tr>
                        `,
                            )
                            .join('')}
                    </tbody>
                </table>

            </body>
            </html>
        `;

            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => printWindow.print(), 300);
        };

        img.onerror = () => {
            alert('Gagal memuat logo. Pastikan file /logo.png ada di folder public.');
            printWindow.close();
        };
    };

    const { props } = usePage<PageProps>();

    const handleSearch = () => {
        const currentPath = window.location.pathname;
        const routeUrl = currentPath.startsWith('/karantina') ? '/karantina' : '/orders';

        router.get(routeUrl, {
            search,
            trashed: filters.trashed,
        });
    };

    // const [orderIdToEditExit, setOrderIdToEditExit] = useState<number | null>(null);

    interface SortButtonProps {
        label: string;
        field: string;
        currentSort?: string;
        currentDir?: string;
    }

    const SortButton = ({ label, field, currentSort, currentDir }: SortButtonProps) => {
        const direction = currentSort === field ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc';

        return (
            <Link
                href={route('orders.index', {
                    sort_by: field,
                    sort_dir: direction,
                    trashed: filters.trashed,
                    search: filters.search,
                })}
                className="flex items-center gap-1 font-semibold text-gray-700 hover:text-black"
            >
                {label}
                {currentSort === field ? (
                    direction === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                    ) : (
                        <ArrowDown className="h-4 w-4" />
                    )
                ) : (
                    <ArrowUpDown className="h-4 w-4 text-gray-400" />
                )}
            </Link>
        );
    };

    // Kelompokkan data orders berdasarkan `no_aju` jika ada, jika tidak gunakan `order_id`
    const groupKeys: string[] = [];
    const groupedOrders: Record<string, Order[]> = {};
    for (const order of orders.data) {
        const groupKey = order.no_aju ?? order.order_id;
        if (!groupedOrders[groupKey]) {
            groupedOrders[groupKey] = [];
            groupKeys.push(groupKey);
        }
        groupedOrders[groupKey].push(order);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Order Management" />
            <OrdersLayout>
                <div className="space-y-6">
                    {/* Flash Message */}
                    {props.flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{props.flash.success}</div>}

                    <Heading title="Order List" description="Manage all registered orders and their statuses." />

                    {/* Toggle Trashed */}
                    {/* <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={toggleTrashed}>
                            {isTrashed ? 'Sembunyikan Order Dihapus' : 'Tampilkan Order Dihapus'}
                        </Button>
                    </div> */}

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="search"
                                placeholder="Search by customer, product, or container"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} className="w-full sm:w-auto">
                                Search
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="customer-filter">Filter Customer</Label>
                        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
                            <option value="">Semua Customer</option>
                            {customers.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label>Filter Periode</Label>
                        <div className="flex gap-2">
                            <select
                                value={periodMonth}
                                onChange={(e) => setPeriodMonth(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Semua Bulan</option>
                                {Array.from({ length: 12 }, (_, i) => {
                                    const month = (i + 1).toString().padStart(2, '0');
                                    return (
                                        <option key={month} value={month}>
                                            {new Date(2024, i).toLocaleString('id-ID', { month: 'long' })}
                                        </option>
                                    );
                                })}
                            </select>

                            <select
                                value={periodYear}
                                onChange={(e) => setPeriodYear(e.target.value)}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="">Semua Tahun</option>
                                {Array.from({ length: 15 }, (_, i) => {
                                    const year = (2020 + i).toString();
                                    return (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Button onClick={handlePrint} className="mb-2">
                            <PrinterIcon className="mr-2 h-4 w-4" />
                            Cetak Billing Statement
                        </Button>
                    </div>

                    {/* Tombol Create Order */}
                    <div className="flex justify-end">
                        {/* <Button asChild className="mb-2">
                            <Link href="/orders/create">+ Create Orders</Link>
                        </Button> */}
                    </div>
                    {/* Data Table */}
                    <div className="w-full rounded-md border">
                        <div className="overflow-x-auto" style={{ maxWidth: '100vw' }}></div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {/* Sort by Nama Customer */}
                                    {/* <TableHead>
                                        <SortButton
                                            label="Nama Customer"
                                            field="customers.name"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead> */}

                                    {/* Sort by Produk */}
                                    {/* <TableHead>
                                        <SortButton
                                            label="Produk"
                                            field="products.service_type"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead> */}

                                    {/* Sort by Nomor Kontainer */}
                                    <TableHead>
                                        <SortButton
                                            label="Nomor Kontainer"
                                            field="container_number"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead>
                                    {/* <TableHead>Nama Customer</TableHead> */}
                                    <TableHead>
                                        <SortButton
                                            label="Nama Shipper"
                                            field="shippers.name"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead>
                                    <TableHead>Size</TableHead>
                                    {/* Kolom lain tetap seperti sebelumnya */}
                                    <TableHead>Tanggal Masuk</TableHead>
                                    <TableHead>Tanggal EIR</TableHead>
                                    <TableHead>Tanggal Keluar</TableHead>
                                    <TableHead>Komoditi</TableHead>
                                    <TableHead>
                                        <SortButton label="Fumigasi" field="fumigasi" currentSort={filters.sort_by} currentDir={filters.sort_dir} />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell className="py-8 text-center text-sm text-muted-foreground">
                                            Tidak ada data yang sesuai filter.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <TableRow key={order.id} className="group">
                                            {/* <TableCell className="py-3 font-medium">{order.order?.customer?.name ?? '-'}</TableCell> */}
                                            {/* <TableCell className="py-3">{order.product?.service_type ?? '-'}</TableCell> */}
                                            <TableCell className="py-3">{order.container_number}</TableCell>
                                            {/* <TableCell>{order.order?.customer?.name ?? '-'}</TableCell> */}
                                            <TableCell className="py-3">{order.order?.shipper?.name ?? '-'}</TableCell>
                                            <TableCell className="py-3">{order.price_type ?? '-'}</TableCell>
                                            <TableCell className="py-3">
                                                {order.entry_date ? new Date(order.entry_date).toLocaleString() : <span>-</span>}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {order.eir_date ? new Date(order.eir_date).toLocaleString() : <span>-</span>}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                {order.exit_date ? new Date(order.exit_date).toLocaleString() : <span>-</span>}
                                            </TableCell>
                                            <TableCell className="py-3">{order.commodity ?? '-'}</TableCell>
                                            <TableCell className="py-3">
                                                {order.order?.fumigasi ? (
                                                    <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                                                        {order.order.fumigasi.length > 50
                                                            ? `${order.order.fumigasi.substring(0, 50)}...`
                                                            : order.order.fumigasi}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">–</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Pagination */}
                <div className="flex flex-wrap justify-center gap-1">
                    {orders.links.map((link, i) =>
                        link.url ? (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                onClick={() => router.get(link.url!)}
                                className="px-3 py-1 whitespace-nowrap"
                            >
                                {link.label.replace(/&laquo; Previous|Next &raquo;/, (match) => {
                                    if (match.includes('Previous')) return '← Prev';
                                    if (match.includes('Next')) return 'Next →';
                                    return match;
                                })}
                            </Button>
                        ) : (
                            <span key={i} className="px-3 py-1">
                                ...
                            </span>
                        ),
                    )}
                </div>

                <Dialog open={isTempDialogOpen} onOpenChange={setIsTempDialogOpen}>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Rekam Suhu Kontainer</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-2">
                            {tempRecords.map((rec, rIdx) => (
                                <div key={rIdx} className="space-y-2 rounded border p-4">
                                    {/* Input Tanggal */}
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
                                    {/* Input Suhu per Jam */}
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
                            {/* Tombol tambah tanggal baru */}
                            <Button type="button" variant="outline" onClick={addDateRecord} className="flex items-center gap-2">
                                <PlusCircle className="h-4 w-4" /> Tambah Tanggal
                            </Button>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setIsTempDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button onClick={handleSaveTemp}>Simpan</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </OrdersLayout>
        </AppLayout>
    );
}
