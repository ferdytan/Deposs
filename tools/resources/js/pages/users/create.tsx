import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import UsersLayout from '@/layouts/users/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

type Role = {
    id: number;
    name: string;
};

type Props = {
    roles: Role[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master User',
        href: '/users',
    },
    {
        title: 'Create User',
        href: '/users/create',
    },
];

export default function CreateUser({ roles }: Props) {
    const [form, setForm] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        role_id: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/users', form, {
            onFinish: () => setProcessing(false),
            onError: (err) => setErrors(err),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create User" />

            <UsersLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Create New User" description="Fill in the details below to create a new user." />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Full name" disabled={processing} />
                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Username"
                                disabled={processing}
                            />
                            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="Email address"
                                disabled={processing}
                            />
                            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Password"
                                disabled={processing}
                            />
                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <Input
                                id="password_confirmation"
                                name="password_confirmation"
                                type="password"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                disabled={processing}
                            />
                            {errors.password_confirmation && <p className="text-sm text-destructive">{errors.password_confirmation}</p>}
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role_id">Role</Label>
                            <Select onValueChange={(value) => setForm((prev) => ({ ...prev, role_id: value }))}>
                                <SelectTrigger id="role_id" disabled={processing}>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map((role) => (
                                        <SelectItem key={role.id} value={role.id.toString()}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.role_id && <p className="text-sm text-destructive">{errors.role_id}</p>}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button type="submit" className="w-full sm:w-auto" disabled={processing}>
                                {processing && <span className="mr-2 animate-spin">●</span>}
                                Create User
                            </Button>
                        </div>
                    </form>
                </div>
            </UsersLayout>
        </AppLayout>
    );
}
