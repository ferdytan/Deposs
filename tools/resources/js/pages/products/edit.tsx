import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import ProductsLayout from '@/layouts/products/layout';
import { Head, useForm, usePage } from '@inertiajs/react';

// Tipe Props
interface PageProps {
    product: {
        id: number;
        service_type: string;
        description: string | null;
        requires_temperature: number; // 0 atau 1
    };
    [key: string]: unknown;
}

export default function EditProduct() {
    const { product } = usePage<PageProps>().props;

    const { data, setData, put, processing, errors } = useForm({
        service_type: product.service_type,
        description: product.description ?? '',
        requires_temperature: Number(product.requires_temperature),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('products.update', product.id));
    };

    return (
        <AppLayout>
            <Head title="Edit Product" />
            <ProductsLayout>
                <div className="max-w-2xl space-y-6">
                    <h2 className="text-xl font-semibold">Edit Product</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Jenis Layanan */}
                        <div className="space-y-2">
                            <Label htmlFor="service_type">Jenis Layanan</Label>
                            <Input
                                id="service_type"
                                name="service_type"
                                value={data.service_type}
                                onChange={(e) => setData('service_type', e.target.value)}
                                placeholder="Biaya LoLo Full / Paket Fumigasi"
                                required
                            />
                            {errors.service_type && <p className="mt-1 text-sm text-red-500">{errors.service_type}</p>}
                        </div>

                        {/* Rekam Suhu */}
                        <div className="space-y-2">
                            <Label htmlFor="record_temperature" className="flex items-center gap-2">
                                <Switch
                                    id="record_temperature"
                                    checked={data.requires_temperature == 1}
                                    onCheckedChange={(checked: boolean) => setData('requires_temperature', checked ? 1 : 0)}
                                />
                                <span>Butuh Rekam Suhu?</span>
                            </Label>
                            {errors.requires_temperature && <p className="mt-1 text-sm text-red-500">{errors.requires_temperature}</p>}
                        </div>

                        {/* Keterangan */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Keterangan</Label>
                            <Input
                                id="description"
                                name="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Lift On & Lift Off"
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                            {processing && <span className="mr-2 animate-spin">●</span>}
                            Update Product
                        </Button>
                    </form>
                </div>
            </ProductsLayout>
        </AppLayout>
    );
}
