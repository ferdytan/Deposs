import AppLayout from '@/layouts/app-layout';
import UsersLayout from '@/layouts/users/layout';
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

// Definisikan tipe props
interface FlashProps {
    success?: string;
    error?: string;
}

interface PageProps {
    [key: string]: unknown; // Tambahkan index signature
    flash?: FlashProps;
    errors?: Record<string, string>;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        };
    };
}

type User = {
    id: number;
    name: string;
    username: string;
    email: string;
    role: {
        name: string;
    };
    email_verified_at: string | null;
};

type Props = {
    users: {
        data: User[];
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
        title: 'Master User',
        href: '/users',
    },
];

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userIdToVerify, setUserIdToVerify] = useState<number | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);

    // Gunakan usePage dengan tipe yang benar
    const { props } = usePage<PageProps>();

    const handleSearch = () => {
        router.get('/users', { search });
    };

    const handleVerifyClick = (userId: number) => {
        setUserIdToVerify(userId);
        setIsModalOpen(true);
    };

    const confirmVerify = () => {
        if (userIdToVerify !== null) {
            router.post(`/users/${userIdToVerify}/verify`);
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (userId: number) => {
        setUserIdToDelete(userId);
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userIdToDelete !== null) {
            router.delete(`/users/${userIdToDelete}`);
        }
        setDeleteModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Master User" />

            <UsersLayout>
                <div className="space-y-6">
                    {/* Flash Message */}
                    {props.flash?.success && <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">{props.flash.success}</div>}

                    {props.flash?.error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{props.flash.error}</div>}

                    <Heading title="Users List" description="Manage all registered user and their information." />

                    {/* Search Bar */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                                id="search"
                                placeholder="Search by name, username or email"
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

                    {/* Tombol Create User */}
                    <div className="flex justify-end">
                        <Button asChild className="mb-2">
                            <Link href="/users/create">+ Create User</Link>
                        </Button>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Verified</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id} className="group">
                                            <TableCell className="py-3 font-medium">{user.name}</TableCell>
                                            <TableCell className="py-3">{user.username}</TableCell>
                                            <TableCell className="py-3">{user.email}</TableCell>
                                            <TableCell className="py-3">{user.role?.name ?? '-'}</TableCell>
                                            <TableCell className="py-3">{user.email_verified_at ? 'Yes' : 'No'}</TableCell>
                                            <TableCell className="py-3 text-right opacity-0 transition-opacity group-hover:opacity-100 md:opacity-100">
                                                {/* Tombol Verify */}
                                                {!user.email_verified_at && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleVerifyClick(user.id)}
                                                            className="mr-2"
                                                        >
                                                            Verify
                                                        </Button>

                                                        <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Verify User</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to verify this user?
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel onClick={() => setIsModalOpen(false)}>
                                                                        Cancel
                                                                    </AlertDialogCancel>
                                                                    <AlertDialogAction onClick={confirmVerify}>Yes, Verify</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}

                                                {/* Tombol Edit */}
                                                <Button size="sm" variant="outline" asChild className="mr-2">
                                                    <Link href={route('users.edit', user.id)}>Edit</Link>
                                                </Button>

                                                {/* Ikon Trash untuk Delete */}
                                                <button
                                                    type="button"
                                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm text-red-500 hover:bg-red-100 disabled:pointer-events-none disabled:opacity-50"
                                                    onClick={() => handleDeleteClick(user.id)}
                                                    aria-label="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>

                                                {/* Modal Delete */}
                                                <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete this user? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                                                Delete User
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
                        {users.links.map((link, i) =>
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
            </UsersLayout>
        </AppLayout>
    );
}
