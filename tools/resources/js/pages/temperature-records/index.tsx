import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import TemperatureRecordsLayout from '@/layouts/temperature-records/layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type TemperatureRecord = {
    id: number;
    container_number: string;
    order: {
        id: number;
        order_id: string;
        no_aju?: string;
    };
    product?: { service_type: string };
    rekam_suhu: Array<{
        tanggal: string;
        jam_data: Record<string, string>;
    }>;
};

type Props = {
    records: {
        data: TemperatureRecord[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { search?: string };
};

export default function TemperatureRecordsIndex({ records, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = () => {
        router.get('/temperature-records', { search });
    };

    const isSearched = !!(filters.search && filters.search.trim() !== '');

    return (
        <AppLayout breadcrumbs={[{ title: 'Master Temperature', href: '/temperature-records' }]}>
            <Head title="Master Temperature" />
            <TemperatureRecordsLayout>
                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold">Master Temperature</h2>
                        <p className="text-sm text-muted-foreground">Cari rekaman suhu kontainer.</p>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            placeholder="Input Nomor Kontainer"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch}>Cari</Button>
                    </div>

                    {isSearched ? (
                        records.data.length > 0 ? (
                            records.data.map((rec) => (
                                <div key={rec.id} className="rounded border bg-white shadow-sm">
                                    <div className="border-b px-4 py-2">
                                        <strong>Kontainer:</strong> {rec.container_number} | <strong>Order:</strong> {rec.order.order_id}{' '}
                                        {rec.order.no_aju ? `(${rec.order.no_aju})` : ''}
                                        <br />
                                        <strong>Produk:</strong> {rec.product?.service_type ?? '-'}
                                    </div>
                                    <Table className="w-full overflow-x-auto">
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tanggal</TableHead>
                                                {Array.from({ length: 24 }).map((_, i) => (
                                                    <TableHead key={i}>{i.toString().padStart(2, '0')}:00</TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rec.rekam_suhu.map((suhu, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{suhu.tanggal}</TableCell>
                                                    {Array.from({ length: 24 }).map((_, jam) => {
                                                        const val = suhu.jam_data[jam.toString().padStart(2, '0')];
                                                        return (
                                                            <TableCell key={jam} className="text-center">
                                                                {val ? `${val}°C` : ''}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">Data tidak ditemukan.</div>
                        )
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">Silakan input nomor kontainer untuk mencari data suhu.</div>
                    )}

                    <div className="mt-4 flex justify-center gap-1">
                        {records.links.map((link, i) =>
                            link.url ? (
                                <Button key={i} variant={link.active ? 'default' : 'outline'} onClick={() => router.get(link.url!)}>
                                    {link.label.replace(/&laquo; Previous|Next &raquo;/, (match) => {
                                        return match.includes('Previous') ? '← Prev' : match.includes('Next') ? 'Next →' : match;
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
            </TemperatureRecordsLayout>
        </AppLayout>
    );
}
