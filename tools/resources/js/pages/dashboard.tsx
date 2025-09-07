import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react'; // ← Tambahkan `router`
import { useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Breadcrumb
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

// Tipe data
type ContainerData = {
    id: number;
    order_id: number;
    container_number: string;
    entry_date?: string | null;
    exit_date?: string | null;
};

type ProdukTerlarisData = {
    product_label: string;
    total_order: number;
};

// Tipe PageProps yang kompatibel
import type { Page } from '@inertiajs/core';

type PageProps = Page & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role_id: number;
        };
    };
    jumlahContainerMasuk?: number;
    jumlahContainerBelumMasuk?: number;
    jumlahContainerBelumKeluar?: number;
    dataContainerBelumMasuk?: ContainerData[];
    dataContainerBelumKeluar?: ContainerData[];
    produkTerlaris?: ProdukTerlarisData[];
};

export default function Dashboard() {
    // Ambil props dan role_id
    const { props } = usePage<PageProps>();
    const roleId = props.auth?.user?.role_id;

    // Redirect otomatis jika role_id = 4
    useEffect(() => {
        if (roleId == 4) {
            router.visit('/karantina');
        }
    }, [roleId]);

    // Jika role_id = 4, jangan render apa-apa (akan redirect)
    if (roleId == 4) {
        return null;
    }

    // Ambil data dari props
    const {
        jumlahContainerMasuk = 0,
        jumlahContainerBelumMasuk = 0,
        jumlahContainerBelumKeluar = 0,
        dataContainerBelumMasuk = [],
        dataContainerBelumKeluar = [],
        produkTerlaris = [],
    } = props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Statistic Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Container Masuk - Role 1, 2, 3 */}
                    {(roleId == 1 || roleId == 2 || roleId == 3) && (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="text-sm font-medium text-neutral-500">Container Masuk</span>
                            <span className="mt-2 text-4xl font-semibold text-gray-700">{jumlahContainerMasuk}</span>
                        </div>
                    )}

                    {/* Belum Ada Jam Keluar - Role 1, 2 */}
                    {(roleId == 1 || roleId == 2) && (
                        <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="text-sm font-medium text-neutral-500">Belum Ada Jam Keluar</span>
                            <span className="mt-2 text-4xl font-semibold text-gray-700">{jumlahContainerBelumKeluar}</span>
                        </div>
                    )}

                    {/* Top 10 Produk Terlaris - Hanya Role 1 */}
                    {roleId == 1 && (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
                            <span className="text-sm font-medium text-neutral-500">Top 10 Produk Terlaris</span>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={produkTerlaris} margin={{ top: 10, right: 30, left: 10, bottom: 10 }} barCategoryGap={0} barGap={2}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="product_label" type="category" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        type="number"
                                        allowDecimals={false}
                                        domain={[0, 'dataMax']}
                                        tickFormatter={(value: number) => `${Math.round(value)}`}
                                    />
                                    <Tooltip formatter={(value: number) => `${Math.round(value)}`} />
                                    <Bar dataKey="total_order" fill="#23272e" barSize={42} radius={[80, 80, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Tabel: Belum Ada Jam Masuk */}
                <div className="mt-8">
                    <h2 className="mb-2 text-lg font-bold">
                        <span className="mr-2 text-xl font-bold text-orange-500">{jumlahContainerBelumMasuk}</span> Kontainer Belum Ada Jam Masuk
                    </h2>

                    <div className="overflow-auto rounded-xl border">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-100">
                                    <th className="px-3 py-2 text-left">No</th>
                                    <th className="px-3 py-2 text-left">Nomor Kontainer</th>
                                    <th className="px-3 py-2 text-left">Entry Date</th>
                                    <th className="px-3 py-2 text-left">Exit Date</th>
                                    <th className="px-3 py-2 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataContainerBelumMasuk.length == 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-neutral-400">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                ) : (
                                    dataContainerBelumMasuk.map((row, i) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="px-3 py-2">{i + 1}</td>
                                            <td className="px-3 py-2">{row.container_number}</td>
                                            <td className="px-3 py-2">{row.entry_date ?? '-'}</td>
                                            <td className="px-3 py-2">{row.exit_date ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <a
                                                    href={route('orders.items.simple.show', row.id)}
                                                    className="text-blue-600 hover:underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Detail
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Tabel: Belum Ada Jam Keluar */}
                <div className="mt-8">
                    <h2 className="mb-2 text-lg font-bold">
                        <span className="mr-2 text-xl font-bold text-orange-500">{jumlahContainerBelumKeluar}</span> Daftar Kontainer Belum Ada Jam
                        Keluar
                    </h2>
                    <div className="overflow-auto rounded-xl border">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-neutral-100">
                                    <th className="px-3 py-2 text-left">No</th>
                                    <th className="px-3 py-2 text-left">Nomor Kontainer</th>
                                    <th className="px-3 py-2 text-left">Entry Date</th>
                                    <th className="px-3 py-2 text-left">Exit Date</th>
                                    <th className="px-3 py-2 text-left">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataContainerBelumKeluar.length == 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-neutral-400">
                                            Tidak ada data
                                        </td>
                                    </tr>
                                ) : (
                                    dataContainerBelumKeluar.map((row, i) => (
                                        <tr key={row.id} className="border-t">
                                            <td className="px-3 py-2">{i + 1}</td>
                                            <td className="px-3 py-2">{row.container_number}</td>
                                            <td className="px-3 py-2">{row.entry_date ?? '-'}</td>
                                            <td className="px-3 py-2">{row.exit_date ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <a
                                                    href={route('orders.items.simple.show', row.id)}
                                                    className="text-blue-600 hover:underline"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    Detail
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
