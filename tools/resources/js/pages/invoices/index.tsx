import AppLayout from '@/layouts/app-layout';
import InvoicesLayout from '@/layouts/invoices/layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
import { Trash2 } from 'lucide-react';

// Types
interface FlashProps {
    success?: string;
    error?: string;
}

interface Invoice {
    id: number;
    invoice_number: string;
    customer: { name: string };
    period_start: string;
    period_end: string;
    subtotal: number;
    ppn: number;
    materai: number;
    grand_total: number;
    status: 'paid' | 'unpaid';
    created_at: string;
    items_count: number; // jumlah kontainer (tetap)
    additional_qty_total?: number; // <-- NEW: total qty additional (dari backend)
}

interface InvoicesData {
    data: Invoice[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface PageProps {
    [k: string]: unknown;
    invoices: InvoicesData;
    filters: {
        search?: string;
    };
    flash?: FlashProps;
}

export default function InvoicesIndex() {
    const page = usePage<PageProps>();
    const { invoices, filters, flash } = page.props;
    const [search, setSearch] = useState(filters?.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [invoiceIdToDelete, setInvoiceIdToDelete] = useState<number | null>(null);

    const handleSearch = () => {
        router.get(
            '/invoices',
            { search },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleDeleteClick = (id: number) => {
        setInvoiceIdToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (invoiceIdToDelete !== null) {
            router.delete(`/invoices/${invoiceIdToDelete}`);
        }
        setDeleteModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daftar Invoice" />
            <InvoicesLayout>
                <div className="mx-auto max-w-6xl space-y-6">
                    {/* Flash Messages */}
                    {flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{flash.success}</div>}
                    {flash?.error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{flash.error}</div>}

                    {/* Judul Halaman */}
                    <Heading title="Daftar Invoice" description="Kelola semua invoice yang telah dibuat dan detailnya." />

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Cari</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="search"
                                placeholder="Cari berdasarkan nomor invoice atau nama customer"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} className="w-full sm:w-auto">
                                Cari
                            </Button>
                        </div>
                    </div>

                    {/* Tombol Buat Invoice */}
                    <div className="flex justify-end">
                        <Button asChild className="mb-2">
                            <Link href="/invoices/create">+ Buat Invoice</Link>
                        </Button>
                    </div>

                    {/* Tabel Daftar Invoice */}
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nomor Invoice</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Periode</TableHead>
                                    <TableHead>Jumlah Kontainer</TableHead>
                                    {/* <TableHead>Qty Additional</TableHead> */}
                                    <TableHead>Total</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Dibuat Pada</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices?.data?.length ? (
                                    invoices.data.map((invoice) => {
                                        // Normalisasi status agar tombol/label selalu muncul benar
                                        const st = (invoice.status ?? 'unpaid').toString().toLowerCase(); // 'paid' | 'unpaid'

                                        return (
                                            <TableRow key={invoice.id} className="group">
                                                <TableCell className="py-3 font-medium">{invoice.invoice_number}</TableCell>
                                                <TableCell className="py-3">{invoice.customer.name}</TableCell>

                                                <TableCell className="py-3">
                                                    {new Date(invoice.period_start).toLocaleDateString('id-ID')} -{' '}
                                                    {new Date(invoice.period_end).toLocaleDateString('id-ID')}
                                                </TableCell>

                                                <TableCell className="py-3">{invoice.items_count}</TableCell>
                                                {/* <TableCell className="py-3">{invoice.additional_qty_total ?? 0}</TableCell> */}

                                                <TableCell className="py-3">Rp {Number(invoice.grand_total ?? 0).toLocaleString('id-ID')}</TableCell>

                                                <TableCell className="py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            st === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {st === 'paid' ? 'Lunas' : 'Belum Lunas'}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-3">{new Date(invoice.created_at).toLocaleDateString('id-ID')}</TableCell>

                                                <TableCell className="py-3 text-right">
                                                    {/* Toggle status */}
                                                    {st === 'unpaid' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => router.put(`/invoices/${invoice.id}/pay`)}
                                                            className="mr-2 bg-green-600 text-white hover:bg-green-700"
                                                        >
                                                            Lunas
                                                        </Button>
                                                    )}

                                                    {st === 'paid' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => router.put(`/invoices/${invoice.id}/unpay`)}
                                                            className="mr-2 bg-amber-600 text-white hover:bg-amber-700"
                                                        >
                                                            Belum Lunas
                                                        </Button>
                                                    )}

                                                    {/* Show */}
                                                    <Button size="sm" variant="outline" asChild className="mr-2">
                                                        <Link href={`/invoices/${invoice.id}`}>Show</Link>
                                                    </Button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-red-500 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                                                        onClick={() => handleDeleteClick(invoice.id)}
                                                        aria-label="Hapus"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={10} className="py-8 text-center text-sm text-gray-500">
                                            Belum ada invoice.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap justify-center gap-1">
                        {invoices?.links?.map((link, i) =>
                            link.url ? (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    onClick={() => router.get(link.url!)} // URL sudah mengandung `?search=...`
                                    className="px-3 py-1 whitespace-nowrap"
                                >
                                    {link.label.replace(/&laquo; Previous|Next &raquo;/, (match) => {
                                        if (match.includes('Previous')) return '← Sebelumnya';
                                        if (match.includes('Next')) return 'Selanjutnya →';
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

                {/* Modal Hapus */}
                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Invoice</AlertDialogTitle>
                            <AlertDialogDescription>
                                Anda yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
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
];
