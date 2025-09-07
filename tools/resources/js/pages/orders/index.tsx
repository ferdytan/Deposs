import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Fragment, useState } from 'react';

import { Thermometer } from 'lucide-react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, X } from 'lucide-react';

// UI Components
import Heading from '@/components/heading';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';

// Types
interface FlashProps {
    success?: string;
    error?: string;
}

type Props = {
    orders: {
        data: Order[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
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

function formatDate(dateStr?: string | null) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const monthShort = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthShort[date.getMonth()];
    const year = date.getFullYear();
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hour}:${minute}`;
}

export default function OrdersIndex({ orders, filters: rawFilters }: Props) {
    const filters = rawFilters || {};
    const [search, setSearch] = useState(filters?.search ?? '');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [isTrashed, setIsTrashed] = useState(!!filters.trashed);

    const [isTempDialogOpen, setIsTempDialogOpen] = useState(false);
    const [tempOrder, setTempOrder] = useState<Order | null>(null);
    const [tempRecords, setTempRecords] = useState<TemperatureRecord[]>([]);
    const [collapsedGroups, setCollapsedGroups] = useState<{ [key: string]: boolean }>({});

    const handleOpenTempModal = (order: Order) => {
        console.log('DATA ORDER:', order);
        console.log('TEMPERATURE:', order.temperature);
        setTempOrder(order);
        if (order.temperature && Object.keys(order.temperature).length > 0) {
            const records: TemperatureRecord[] = Object.entries(order.temperature).map(([date, temps]) => ({
                date,
                temps: temps || {},
            }));
            setTempRecords(records);
        } else {
            setTempRecords([{ date: new Date().toISOString().slice(0, 10), temps: {} }]);
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

    const { props } = usePage<PageProps>();
    const roleId = props.auth?.user?.role_id;

    const handleSearch = () => {
        router.get('/orders', { search, trashed: filters.trashed });
    };

    const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
    const [entryDateInput, setEntryDateInput] = useState<string>('');
    const [orderIdToEditEntry, setOrderIdToEditEntry] = useState<number | null>(null);

    const handleAddEntryDate = (id: number) => {
        setOrderIdToEditEntry(id);
        setEntryDateInput('');
        setIsEntryDialogOpen(true);
    };

    const handleEditEntryDate = (id: number, currentEntry: string) => {
        setOrderIdToEditEntry(id);
        const iso = currentEntry ? new Date(currentEntry).toISOString().slice(0, 16) : '';
        setEntryDateInput(iso);
        setIsEntryDialogOpen(true);
    };

    const confirmEntryDateUpdate = () => {
        if (!orderIdToEditEntry || !entryDateInput) return;

        router.patch(
            route('orders.update-entry', orderIdToEditEntry),
            {
                entry_date: entryDateInput,
            },
            {
                onSuccess: () => {
                    setIsEntryDialogOpen(false);
                    router.reload({ only: ['orders'] });
                },
            },
        );
    };

    const [isEirDialogOpen, setIsEirDialogOpen] = useState(false);
    const [eirDateInput, setEirDateInput] = useState<string>('');
    const [orderIdToEdit, setOrderIdToEdit] = useState<number | null>(null);

    const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
    const [exitDateInput, setExitDateInput] = useState<string>('');
    const [orderIdToEditExit, setOrderIdToEditExit] = useState<number | null>(null);
    const handleAddExitDate = (id: number) => {
        setOrderIdToEditExit(id);
        setExitDateInput('');
        setIsExitDialogOpen(true);
    };

    const handleEditExitDate = (id: number, currentExitDate: string) => {
        setOrderIdToEditExit(id);
        const isoDate = currentExitDate ? new Date(currentExitDate).toISOString().slice(0, 16) : '';
        setExitDateInput(isoDate);
        setIsExitDialogOpen(true);
    };

    const confirmExitDateUpdate = () => {
        if (!orderIdToEditExit || !exitDateInput) return;

        router.patch(
            route('orders.update-exit', orderIdToEditExit),
            { exit_date: exitDateInput },
            {
                onSuccess: () => {
                    setIsExitDialogOpen(false);
                },
            },
        );
    };

    const handleAddEirDate = (id: number) => {
        setOrderIdToEdit(id);
        setEirDateInput('');
        setIsEirDialogOpen(true);
    };

    const handleEditEirDate = (id: number, currentEirDate: string) => {
        setOrderIdToEdit(id);
        // Konversi ke format ISO tanpa zona waktu
        const isoDate = currentEirDate ? new Date(currentEirDate).toISOString().slice(0, 16) : '';
        setEirDateInput(isoDate); // Pastikan input menerima format yang benar
        setIsEirDialogOpen(true);
    };

    const confirmEirDateUpdate = () => {
        if (!orderIdToEdit || !eirDateInput) return;

        router.patch(
            route('orders.update-eir', orderIdToEdit),
            { eir_date: eirDateInput },
            {
                onSuccess: () => {
                    setIsEirDialogOpen(false);
                    // Opsional: refresh data atau tampilkan pesan sukses
                },
            },
        );
    };
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

    const confirmDelete = () => {
        if (orderIdToEdit !== null && deleteReason.trim()) {
            router.delete(route('orders.destroy', orderIdToEdit), {
                data: { reason: deleteReason },
                onSuccess: () => {
                    setDeleteModalOpen(false);
                    setDeleteReason('');
                },
            });
        }
    };

    const toggleTrashed = () => {
        const newTrashed = !isTrashed;
        setIsTrashed(newTrashed);
        router.get('/orders', { trashed: newTrashed ? '1' : undefined });
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
                    <div className="flex items-center justify-between">
                        <Button variant="outline" onClick={toggleTrashed}>
                            {isTrashed ? 'Sembunyikan Order Dihapus' : 'Tampilkan Order Dihapus'}
                        </Button>
                    </div>

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
                    {/* Tombol Create Order */}
                    <div className="flex justify-end">
                        {roleId != 3 && (
                            <Button asChild className="mb-2">
                                <Link href="/orders/create">+ Create Orders</Link>
                            </Button>
                        )}
                    </div>
                    {/* Data Table */}
                    <div className="w-full overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {/* Sort by Nama Customer */}
                                    <TableHead>
                                        <SortButton
                                            label="Nama Customer"
                                            field="customers.name"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead>

                                    {/* Sort by Produk */}
                                    <TableHead>
                                        <SortButton
                                            label="Produk"
                                            field="products.service_type"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                        />
                                    </TableHead>

                                    {/* Sort by Nomor Kontainer */}
                                    <TableHead>
                                        <SortButton
                                            label="Nomor Kontainer"
                                            field="container_number"
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
                                    <TableHead>Temperatur</TableHead>
                                    <TableHead>Fumigator</TableHead>
                                    {isTrashed && <TableHead>Alasan Dihapus</TableHead>}
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={isTrashed ? 11 : 10} className="py-8 text-center text-sm text-muted-foreground">
                                            No orders found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    groupKeys.map((groupKey) => {
                                        const groupOrders = groupedOrders[groupKey];
                                        const firstOrder = groupOrders[0];
                                        const isCollapsed = !!collapsedGroups[groupKey];
                                        return (
                                            <Fragment key={groupKey}>
                                                <TableRow
                                                    className="cursor-pointer bg-gray-100 hover:bg-gray-200"
                                                    onClick={() =>
                                                        setCollapsedGroups((prev) => ({
                                                            ...prev,
                                                            [groupKey]: !prev[groupKey],
                                                        }))
                                                    }
                                                >
                                                    <TableCell
                                                        colSpan={isTrashed ? 11 : 10}
                                                        className="flex items-center justify-between py-3 font-semibold"
                                                    >
                                                        <div className="mr-3">
                                                            Nomor Order: {firstOrder.order?.order_id ?? firstOrder.order_id} / No. AJU:{' '}
                                                            {firstOrder.no_aju ?? '-'}
                                                            {isCollapsed ? (
                                                                <ArrowDown className="ml-2 inline h-4 w-4" />
                                                            ) : (
                                                                <ArrowUp className="ml-2 inline h-4 w-4" />
                                                            )}
                                                        </div>
                                                        <div className="flex gap-3">
                                                            {isTrashed ? (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        router.post(
                                                                            route('orders.restore', firstOrder.id),
                                                                            {},
                                                                            {
                                                                                onSuccess: () => {
                                                                                    router.get(route('orders.index'), { trashed: true });
                                                                                },
                                                                                preserveScroll: true,
                                                                            },
                                                                        );
                                                                    }}
                                                                    className="inline-flex items-center gap-1"
                                                                    title="Pulihkan Order"
                                                                >
                                                                    <RotateCcw className="h-4 w-4" />
                                                                    Pulihkan
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    {roleId != 3 && (
                                                                        <Link
                                                                            href={route('orders.show', firstOrder.order?.id ?? firstOrder.order_id)} // ✅ Gunakan route detail order
                                                                            title="Lihat Detail Order"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                                                        </Link>
                                                                    )}
                                                                    {roleId != 3 && (
                                                                        <Link
                                                                            href={route('orders.edit', firstOrder.order.id)}
                                                                            title="Edit Order"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Pencil className="h-4 w-4 text-blue-500 hover:text-blue-700" />
                                                                        </Link>
                                                                    )}
                                                                    {/* <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const reason = prompt('Masukkan alasan hapus order:');
                                                                            if (reason) {
                                                                                router.delete(route('orders.destroy', firstOrder.order.id), {
                                                                                    data: { delete_reason: reason },
                                                                                });
                                                                            }
                                                                        }}
                                                                        title="Hapus Order"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                                                                    </button> */}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {!isCollapsed &&
                                                    groupOrders.map((order) => (
                                                        <TableRow key={order.id} className="group">
                                                            <TableCell className="py-3 font-medium">{order.order?.customer?.name ?? '-'}</TableCell>

                                                            <TableCell className="py-3">{order.product?.service_type ?? '-'}</TableCell>

                                                            <TableCell className="py-3">{order.container_number}</TableCell>
                                                            <TableCell className="py-3">{order.price_type ?? '-'}</TableCell>
                                                            <TableCell className="py-3">
                                                                {order.entry_date ? (
                                                                    <button
                                                                        onClick={() => handleEditEntryDate(order.id, order.entry_date ?? '')}
                                                                        className="flex items-center gap-1 hover:underline"
                                                                    >
                                                                        {formatDate(order.entry_date)}
                                                                        <Pencil className="h-4 w-4 text-blue-500" />
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleAddEntryDate(order.id)}
                                                                        className="flex items-center gap-1 hover:underline"
                                                                    >
                                                                        Tambah
                                                                        <Plus className="h-4 w-4 text-green-500" />
                                                                    </button>
                                                                )}
                                                            </TableCell>
                                                            
                                                            <TableCell className="py-3">
                                                                {roleId != 3 && (
                                                                    <>
                                                                        {order.eir_date ? (
                                                                            <button
                                                                                onClick={() => handleEditEirDate(order.id, order.eir_date ?? '')}
                                                                                className="flex items-center gap-1 hover:underline"
                                                                            >
                                                                                {formatDate(order.eir_date)}
                                                                                <Pencil className="h-4 w-4 text-blue-500" />
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleAddEirDate(order.id)}
                                                                                className="flex items-center gap-1 hover:underline"
                                                                            >
                                                                                Tambah
                                                                                <Plus className="h-4 w-4 text-green-500" />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="py-3">
                                                                {roleId != 3 && (
                                                                    <>
                                                                        {order.exit_date ? (
                                                                            <button
                                                                                onClick={() => handleEditExitDate(order.id, order.exit_date ?? '')}
                                                                                className="flex items-center gap-1 hover:underline"
                                                                            >
                                                                                {formatDate(order.exit_date)}
                                                                                <Pencil className="h-4 w-4 text-blue-500" />
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                onClick={() => handleAddExitDate(order.id)}
                                                                                className="flex items-center gap-1 hover:underline"
                                                                            >
                                                                                Tambah
                                                                                <Plus className="h-4 w-4 text-green-500" />
                                                                            </button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </TableCell>
                                                            <TableCell className="py-3">{order.commodity ?? '-'}</TableCell>
                                                            {/* {roleId != 3 && ( */}
                                                            <TableCell className="py-3 text-center">
                                                                {String(order.product?.requires_temperature) === '1' && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        onClick={() => handleOpenTempModal(order)}
                                                                        title="Edit Rekam Suhu"
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Thermometer className="h-4 w-4 cursor-pointer text-orange-500" />
                                                                    </Button>
                                                                )}
                                                            </TableCell>
                                                            {/* )} */}
                                                            <TableCell className="py-3">
                                                                {order.order?.fumigasi ? order.order.fumigasi : '-'}
                                                            </TableCell>
                                                            {isTrashed && (
                                                                <TableCell className="py-3 text-red-600">{order.deleted_reason ?? '-'}</TableCell>
                                                            )}
                                                            <TableCell className="text-right">
                                                                {!isTrashed && roleId != 3 && (
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <Button size="icon" variant="ghost" asChild title="Lihat Detail">
                                                                            <Link
                                                                                href={route('orders.items.simple.show', firstOrder.id)} // Gunakan ID item pertama dan route baru
                                                                                title="Lihat Order Item Pertama"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                                                                            </Link>
                                                                        </Button>
                                                                        <Button
                                                                            size="icon"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                const reason = prompt('Masukkan alasan hapus kontainer:');
                                                                                if (reason) {
                                                                                    router.delete(route('order-items.destroy', order.id), {
                                                                                        data: { delete_reason: reason },
                                                                                    });
                                                                                }
                                                                            }}
                                                                            title="Hapus"
                                                                            className="cursor-pointer text-red-500 hover:bg-red-100"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
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
                </div>

                {/* AlertDialog for Delete */}
                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Order</AlertDialogTitle>
                            <AlertDialogDescription>Masukkan alasan penghapusan order ini:</AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <Input placeholder="Alasan penghapusan" value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} required />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction disabled={!deleteReason.trim()} onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                Hapus Order
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isEirDialogOpen} onOpenChange={setIsEirDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{eirDateInput ? 'Edit Tanggal EIR' : 'Tambah Tanggal EIR'}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <Label htmlFor="eir-date">Tanggal EIR</Label>
                            <Input
                                id="eir-date"
                                type="datetime-local"
                                value={eirDateInput}
                                onChange={(e) => setEirDateInput(e.target.value)}
                                required
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsEirDialogOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmEirDateUpdate} className="bg-blue-600 hover:bg-blue-700">
                                Simpan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{exitDateInput ? 'Edit Tanggal Keluar' : 'Tambah Tanggal Keluar'}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <Label htmlFor="exit-date">Tanggal Keluar</Label>
                            <Input
                                id="exit-date"
                                type="datetime-local"
                                value={exitDateInput}
                                onChange={(e) => setExitDateInput(e.target.value)}
                                required
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsExitDialogOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmExitDateUpdate} className="bg-blue-600 hover:bg-blue-700">
                                Simpan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <AlertDialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{entryDateInput ? 'Edit Tanggal Masuk' : 'Tambah Tanggal Masuk'}</AlertDialogTitle>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                            <Label htmlFor="entry-date">Tanggal Masuk</Label>
                            <Input
                                id="entry-date"
                                type="datetime-local"
                                value={entryDateInput}
                                onChange={(e) => setEntryDateInput(e.target.value)}
                                required
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setIsEntryDialogOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmEntryDateUpdate} className="bg-blue-600 hover:bg-blue-700">
                                Simpan
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

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
