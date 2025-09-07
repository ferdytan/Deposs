import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import ShippersLayout from '@/layouts/shippers/layout';
import { Head, useForm } from '@inertiajs/react';

type Props = {
    shipper: {
        id: number;
        name: string;
        address: string | null; // bisa null
        city: string | null;
        province: string | null;
        phone: string | null;
        email: string | null; // bisa null
    };
};

export default function EditShipper({ shipper }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: shipper.name,
        address: shipper.address ?? '', // fallback ke string kosong
        city: shipper.city ?? '',
        province: shipper.province ?? '',
        phone: shipper.phone ?? '',
        email: shipper.email ?? '', // fallback ke string kosong
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('shippers.update', shipper.id));
    };

    return (
        <AppLayout>
            <Head title="Edit Shipper" />
            <ShippersLayout>
                <div className="max-w-2xl space-y-6">
                    <HeadingSmall title="Edit Shipper" description="" />
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Shipper Name - REQUIRED */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Shipper Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="PT. Tiga Rasa Indonesia"
                                required
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        {/* Address - OPTIONAL */}
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Jl. Kalianak Utara"
                                // ❌ removed 'required'
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        {/* City & Province */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* City */}
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    name="city"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="Surabaya"
                                />
                                {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                            </div>

                            {/* Province */}
                            <div className="space-y-2">
                                <Label htmlFor="province">Province</Label>
                                <Input
                                    id="province"
                                    name="province"
                                    value={data.province}
                                    onChange={(e) => setData('province', e.target.value)}
                                    placeholder="East Java"
                                />
                                {errors.province && <p className="text-sm text-red-500">{errors.province}</p>}
                            </div>
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Phone */}
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="628122224445"
                                />
                                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                            </div>

                            {/* Email - OPTIONAL */}
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="order@tigarasa.com"
                                    // ❌ removed 'required'
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                            {processing && <span className="mr-2 animate-spin">●</span>}
                            Update Shipper
                        </Button>
                    </form>
                </div>
            </ShippersLayout>
        </AppLayout>
    );
}
