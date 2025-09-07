import AppLayout from '@/layouts/app-layout';
import ProductsLayout from '@/layouts/products/layout';
import { type BreadcrumbItem } from '@/types';
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
import { ArrowDown, ArrowUp, ArrowUpDown, Trash2 } from 'lucide-react';

// Types
interface FlashProps {
    success?: string;
    error?: string;
}
interface PageProps {
    [key: string]: unknown;
    flash?: FlashProps;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

type SortButtonProps = {
    label: string;
    field: string;
    currentSort?: string;
    currentDir?: string;
    trashed?: string; // Optional, kalau mau support filter trashed di products
    search?: string; // Untuk passing search filter
};

type Product = {
    id: number;
    service_type: string;
    description: string | null;
    requires_temperature: number; // Diubah dari boolean ke number (0 atau 1)
};

type Props = {
    products: {
        data: Product[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
        sort_by?: string; // Tambahkan!
        sort_dir?: string; // Tambahkan!
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master Product',
        href: '/products',
    },
];

const SortButton = ({ label, field, currentSort, currentDir, trashed, search }: SortButtonProps) => {
    // Menentukan arah sort selanjutnya
    const direction = currentSort === field ? (currentDir === 'asc' ? 'desc' : 'asc') : 'asc';

    return (
        <Link
            href={route('products.index', {
                sort_by: field,
                sort_dir: direction,
                trashed,
                search,
            })}
            className="flex items-center gap-1 font-semibold text-gray-700 hover:text-black"
        >
            {label}
            {currentSort === field ? (
                currentDir === 'asc' ? (
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

export default function ProductsIndex({ products, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState<number | null>(null);

    const { props } = usePage<PageProps>();

    const handleSearch = () => {
        router.get('/products', {
            search,
            sort_by: filters.sort_by,
            sort_dir: filters.sort_dir,
        });
    };

    const handleDeleteClick = (id: number) => {
        setProductIdToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (productIdToDelete !== null) {
            router.delete(`/products/${productIdToDelete}`);
        }
        setDeleteModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Product" />
            <ProductsLayout>
                <div className="space-y-6">
                    {/* Flash Message */}
                    {props.flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{props.flash.success}</div>}

                    {/* Heading */}

                    <Heading title="Product List" description="Manage all registered services." />

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="search"
                                placeholder="Search by service type"
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

                    {/* Tombol Create Product */}
                    <div className="flex justify-end">
                        <Button asChild className="mb-2">
                            <Link href="/products/create">+ Create Product</Link>
                        </Button>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <SortButton
                                            label="Jenis Layanan"
                                            field="service_type"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                            search={filters.search}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortButton
                                            label="Rekam Suhu"
                                            field="requires_temperature"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                            search={filters.search}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortButton
                                            label="Keterangan"
                                            field="description"
                                            currentSort={filters.sort_by}
                                            currentDir={filters.sort_dir}
                                            search={filters.search}
                                        />
                                    </TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                                            No products found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    products.data.map((product) => (
                                        <TableRow key={product.id} className="group">
                                            <TableCell className="py-3 font-medium">{product.service_type}</TableCell>
                                            <TableCell className="py-3">{product.requires_temperature == 1 ? 'Ya' : 'Tidak'}</TableCell>
                                            <TableCell className="py-3">{product.description ?? '-'}</TableCell>
                                            <TableCell className="py-3 text-right opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                                                {/* Tombol Edit */}
                                                <Button size="sm" variant="outline" asChild className="mr-2">
                                                    <Link href={route('products.edit', product.id)}>Edit</Link>
                                                </Button>
                                                {/* Ikon Delete */}
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-red-500 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                                                    onClick={() => handleDeleteClick(product.id)}
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap justify-center gap-1">
                        {products.links.map((link, i) =>
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

                {/* Modal Konfirmasi Delete */}
                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this product? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                Delete Product
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </ProductsLayout>
        </AppLayout>
    );
}
