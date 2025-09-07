import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import UsersLayout from '@/layouts/users/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';

type Role = {
    id: number;
    name: string;
};

type Props = {
    user: {
        id: number;
        name: string;
        username: string;
        email: string;
        role_id: number;
    };
    roles: Role[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Master User',
        href: '/users',
    },
    {
        title: 'Edit User',
        href: '#',
    },
];

export default function EditUser({ user, roles }: Props) {
    const { data, setData, put, processing } = useForm({
        name: user.name,
        username: user.username,
        email: user.email,
        role_id: user.role_id.toString(),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit User" />

            <UsersLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Edit User" description="Edit user information" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Full name"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                name="username"
                                value={data.username}
                                onChange={(e) => setData('username', e.target.value)}
                                placeholder="Username"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Email address"
                            />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role_id">Role</Label>
                            <Select onValueChange={(value) => setData('role_id', value)} value={data.role_id}>
                                <SelectTrigger id="role_id">
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
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button type="submit" disabled={processing} className="w-full sm:w-auto">
                                {processing && <span className="mr-2 animate-spin">●</span>}
                                Update User
                            </Button>
                        </div>
                    </form>
                </div>
            </UsersLayout>
        </AppLayout>
    );
}
