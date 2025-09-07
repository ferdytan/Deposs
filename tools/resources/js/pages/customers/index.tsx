import AppLayout from '@/layouts/app-layout';
import CustomersLayout from '@/layouts/customers/layout';
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
import { Trash2 } from 'lucide-react';

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

type Customer = {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string | null;
    // Tambahkan kolom harga
    default_tariff_20ft: number | null;
    default_tariff_40ft: number | null;
    default_global_tariff: number | null;
};

type Props = {
    customers: {
        data: Customer[];
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customer Management',
        href: '/customers',
    },
];

export default function CustomersIndex({ customers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [customerIdToDelete, setCustomerIdToDelete] = useState<number | null>(null);

    const { props } = usePage<PageProps>();

    const handleSearch = () => {
        router.get('/customers', { search });
    };

    const handleDeleteClick = (id: number) => {
        setCustomerIdToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (customerIdToDelete !== null) {
            router.delete(`/customers/${customerIdToDelete}`);
        }
        setDeleteModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Management" />

            <CustomersLayout>
                <div className="space-y-6">
                    {/* Flash Message */}
                    {props.flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{props.flash.success}</div>}

                    {/* Heading */}
                    <Heading title="Customer List" description="Manage all registered customers and their information." />

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="search"
                                placeholder="Search by name or email"
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

                    {/* Tombol Create Customer */}
                    <div className="flex justify-end">
                        <Button asChild className="mb-2">
                            <Link href="/customers/create">+ Create Customer</Link>
                        </Button>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>City</TableHead>
                                    <TableHead>Province</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                                            No customers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    customers.data.map((customer) => (
                                        <TableRow key={customer.id} className="group">
                                            <TableCell className="py-3 font-medium">{customer.name}</TableCell>
                                            <TableCell className="py-3">{customer.city ?? '-'}</TableCell>
                                            <TableCell className="py-3">{customer.province ?? '-'}</TableCell>
                                            <TableCell className="py-3">{customer.phone ?? '-'}</TableCell>
                                            <TableCell className="py-3">{customer.email ?? '-'}</TableCell>
                                            <TableCell className="py-3 text-right opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                                                {/* Tombol Edit */}
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={route('customers.edit', customer.id)}>Edit</Link>
                                                </Button>

                                                {/* Ikon Delete */}
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-red-500 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                                                    onClick={() => handleDeleteClick(customer.id)}
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>

                                                {/* Modal Delete */}
                                                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this customer? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                                                Delete Customer
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap justify-center gap-1">
                        {customers.links.map((link, i) =>
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
            </CustomersLayout>
        </AppLayout>
    );
}
