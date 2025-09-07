import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { Head, Link, usePage } from '@inertiajs/react';

// Tipe data
interface OrderItem {
    id: number;
    product: { service_type: string };
    container_number: string;
    entry_date?: string;
    eir_date?: string;
    exit_date?: string;
    commodity?: string;
    country?: string;
    vessel?: string;
    price_type?: string;
    price_value?: string | number;
    additional_products: { service_type: string }[];
    rekam_suhu?: { tanggal: string; jam_data: Record<string, string> }[];
}

interface Props {
    order: { id: number; order_id: string };
    orderItem: OrderItem;
}

// Tipe untuk Inertia Page
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
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ShowSingleOrderItem({ order, orderItem }: Props) {
    // Ambil role_id dari props global
    const { props } = usePage<PageProps>();
    const roleId = props.auth?.user?.role_id;
    const isRoleKarantina = roleId == 4;

    // Tentukan rute kembali
    // Karena kita sekarang menggunakan route sederhana berdasarkan orderItem.id,
    // kembali ke halaman daftar order atau detail order utama adalah pilihan yang logis.
    // Misalnya, kembali ke halaman daftar order:
    const backUrl = isRoleKarantina ? '/karantina' : route('orders.index');
    // Atau, jika Anda ingin kembali ke detail order utama (pastikan route ini ada dan aktif):
    // const backUrl = isRoleKarantina ? '/karantina' : route('orders.show', { order: order.id });

    return (
        <AppLayout>
            <Head title={`Detail Order Item: ${orderItem.container_number}`} />
            <OrdersLayout>
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Detail Order Item: {orderItem.container_number}</h2>
                        <Button asChild>
                            <Link href={backUrl}>Kembali</Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader className="font-semibold">Detail Layanan - {orderItem.product.service_type}</CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                                <strong>Nomor Kontainer:</strong> {orderItem.container_number}
                            </div>
                            <div>
                                <strong>Harga:</strong>{' '}
                                {orderItem.price_type ? `${orderItem.price_type} - Rp${Number(orderItem.price_value).toLocaleString()}` : '-'}
                            </div>
                            <div>
                                <strong>Entry Date:</strong> {orderItem.entry_date || '-'}
                            </div>
                            <div>
                                <strong>EIR Date:</strong> {orderItem.eir_date || '-'}
                            </div>
                            <div>
                                <strong>Exit Date:</strong> {orderItem.exit_date || '-'}
                            </div>
                            <div>
                                <strong>Komoditi:</strong> {orderItem.commodity || '-'}
                            </div>
                            <div>
                                <strong>Country:</strong> {orderItem.country || '-'}
                            </div>
                            <div>
                                <strong>Vessel:</strong> {orderItem.vessel || '-'}
                            </div>
                            <div className="col-span-2">
                                <strong>Additional Products:</strong>
                                <ul className="list-disc pl-5">
                                    {orderItem.additional_products.length > 0 ? (
                                        orderItem.additional_products.map((p, idx) => <li key={idx}>{p.service_type}</li>)
                                    ) : (
                                        <li>-</li>
                                    )}
                                </ul>
                            </div>
                            {orderItem.rekam_suhu && orderItem.rekam_suhu.length > 0 && (
                                <div className="col-span-2">
                                    <strong>Rekam Suhu:</strong>
                                    {orderItem.rekam_suhu.map((rec, idx) => (
                                        <div key={idx} className="mt-2 border-t pt-2">
                                            <strong>{rec.tanggal}:</strong>
                                            <div className="grid grid-cols-6 gap-2 text-sm">
                                                {Object.entries(rec.jam_data).map(([jam, suhu]) => (
                                                    <div key={jam}>
                                                        {jam}:00 → {suhu}°C
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}
