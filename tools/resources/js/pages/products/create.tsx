import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import ProductsLayout from '@/layouts/products/layout';
import { Head, useForm } from '@inertiajs/react';

export default function CreateProduct() {
    const { data, setData, post, processing, errors } = useForm({
        service_type: '',
        description: '',
        requires_temperature: 0,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('products.store'));
    };

    return (
        <AppLayout>
            <Head title="Create Product" />
            <ProductsLayout>
                <div className="max-w-2xl space-y-6">
                    <h2 className="text-xl font-semibold">Create New Product</h2>

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
                                    checked={data.requires_temperature === 1}
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
                            Create Product
                        </Button>
                    </form>
                </div>
            </ProductsLayout>
        </AppLayout>
    );
}
