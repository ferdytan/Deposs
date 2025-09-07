import AppLayout from '@/layouts/app-layout';
import ShippersLayout from '@/layouts/shippers/layout';
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

type Shipper = {
    id: number;
    name: string;
    address: string;
    city: string | null;
    province: string | null;
    phone: string | null;
    email: string;
};

type Props = {
    shippers: {
        data: Shipper[];
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
        title: 'Master Shipper',
        href: '/shippers',
    },
];

export default function ShippersIndex({ shippers, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [shipperIdToDelete, setShipperIdToDelete] = useState<number | null>(null);

    const { props } = usePage<PageProps>();

    const handleSearch = () => {
        router.get('/shippers', { search });
    };

    const handleDeleteClick = (id: number) => {
        setShipperIdToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (shipperIdToDelete !== null) {
            router.delete(`/shippers/${shipperIdToDelete}`);
        }
        setDeleteModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master Shipper" />
            <ShippersLayout>
                <div className="space-y-6">
                    {/* Flash Message */}
                    {props.flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{props.flash.success}</div>}

                    {props.flash?.error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{props.flash.error}</div>}

                    {/* Heading */}

                    <Heading title="Shipper List" description="Manage all registered shippers and their information." />

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

                    {/* Tombol Create Shipper */}
                    <div className="flex justify-end">
                        <Button asChild className="mb-2">
                            <Link href="/shippers/create">+ Create Shipper</Link>
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
                                {shippers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                            No shippers found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    shippers.data.map((shipper) => (
                                        <TableRow key={shipper.id} className="group">
                                            <TableCell className="py-3 font-medium">{shipper.name}</TableCell>
                                            <TableCell className="py-3">{shipper.city ?? '-'}</TableCell>
                                            <TableCell className="py-3">{shipper.province ?? '-'}</TableCell>
                                            <TableCell className="py-3">{shipper.phone ?? '-'}</TableCell>
                                            <TableCell className="py-3">{shipper.email}</TableCell>
                                            <TableCell className="py-3 text-right opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                                                {/* Tombol Edit */}
                                                <Button size="sm" variant="outline" asChild className="mr-2">
                                                    <Link href={route('shippers.edit', shipper.id)}>Edit</Link>
                                                </Button>

                                                {/* Ikon Delete */}
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-red-500 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                                                    onClick={() => handleDeleteClick(shipper.id)}
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
                        {shippers.links.map((link, i) =>
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

                    {/* Modal Konfirmasi Delete */}
                    <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Shipper</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this shipper? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                    Delete Shipper
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </ShippersLayout>
        </AppLayout>
    );
}
