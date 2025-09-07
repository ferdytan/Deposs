import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import OrdersLayout from '@/layouts/orders/layout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';

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

interface OrderProps {
    id: number;
    order_id: string;
    no_aju?: string;
    customer: { name: string };
    shipper: { name: string };
    items: OrderItem[];
}

// Tipe PageProps dengan index signature agar kompatibel dengan Inertia
import type { Page } from '@inertiajs/core';
type PageProps = Page & {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; // agar bisa menerima properti dinamis]
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role_id: number;
        };
    };
};

interface Props {
    order: OrderProps;
}

export default function ShowOrder({ order }: Props) {
    // Ambil role_id dari Inertia props
    const { auth } = usePage<PageProps>().props;
    const roleId = auth?.user?.role_id;
    const isRoleKarantina = roleId == 4;

    // Tentukan rute kembali berdasarkan role
    const backUrl = isRoleKarantina ? '/karantina' : '/orders';

    return (
        <AppLayout>
            <Head title={`Detail Order: ${order.order_id}`} />
            <OrdersLayout>
                <div className="space-y-6">
                    {/* Judul dan Aksi */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Detail Order: {order.order_id}</h2>
                        <div className="flex gap-2">
                            {/* Hanya tampilkan tombol Edit jika bukan role_id 4 */}
                            {!isRoleKarantina && (
                                <Button variant="outline" asChild>
                                    <Link href={route('orders.edit', order.id)}>
                                        <Pencil className="mr-1 h-4 w-4" /> Edit
                                    </Link>
                                </Button>
                            )}
                            {/* Tombol Kembali mengarah ke /karantina jika role_id 4 */}
                            <Button asChild>
                                <Link href={backUrl}>Kembali</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Informasi Order */}
                    <Card>
                        <CardHeader className="font-semibold">Informasi Order</CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Nomor Order:</strong> {order.order_id}
                                </div>
                                <div>
                                    <strong>Nomor AJU:</strong> {order.no_aju || '-'}
                                </div>
                                <div>
                                    <strong>Customer:</strong> {order.customer.name}
                                </div>
                                <div>
                                    <strong>Shipper:</strong> {order.shipper?.name || '-'} {/* Gunakan optional chaining dan fallback */}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daftar Item Order */}
                    <div className="grid grid-cols-1 gap-6">
                        {order.items.map((item, idx) => (
                            <Card key={idx}>
                                <CardHeader className="flex items-center justify-between font-semibold">
                                    Layanan #{idx + 1} - {item.product.service_type}
                                </CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div>
                                        <strong>Nomor Kontainer:</strong> {item.container_number}
                                    </div>
                                    <div>
                                        <strong>Harga:</strong>{' '}
                                        {item.price_type ? `${item.price_type} - Rp${Number(item.price_value).toLocaleString()}` : '-'}
                                    </div>
                                    <div>
                                        <strong>Entry Date:</strong> {item.entry_date || '-'}
                                    </div>
                                    <div>
                                        <strong>EIR Date:</strong> {item.eir_date || '-'}
                                    </div>
                                    <div>
                                        <strong>Exit Date:</strong> {item.exit_date || '-'}
                                    </div>
                                    <div>
                                        <strong>Komoditi:</strong> {item.commodity || '-'}
                                    </div>
                                    <div>
                                        <strong>Country:</strong> {item.country || '-'}
                                    </div>
                                    <div>
                                        <strong>Vessel:</strong> {item.vessel || '-'}
                                    </div>
                                    <div className="col-span-2">
                                        <strong>Additional Products:</strong>
                                        <ul className="list-disc pl-5">
                                            {item.additional_products.length > 0 ? (
                                                item.additional_products.map((p, i) => <li key={i}>{p.service_type}</li>)
                                            ) : (
                                                <li>-</li>
                                            )}
                                        </ul>
                                    </div>
                                    {item.rekam_suhu && item.rekam_suhu.length > 0 && (
                                        <div className="col-span-2">
                                            <strong>Rekam Suhu:</strong>
                                            {item.rekam_suhu.map((rec, i) => (
                                                <div key={i} className="mt-2 border-t pt-2">
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
                        ))}
                    </div>
                </div>
            </OrdersLayout>
        </AppLayout>
    );
}
