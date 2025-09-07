import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Book, LayoutGrid, Package, Paperclip, SquareUserRound, Thermometer, Truck, User } from 'lucide-react';
import AppLogo from './app-logo';

// Definisikan item menu utama TANPA menu Karantina
const baseNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'User',
        href: '/users',
        icon: User,
    },
    {
        title: 'Customers',
        href: '/customers',
        icon: SquareUserRound,
    },
    {
        title: 'Shippers',
        href: '/shippers',
        icon: Truck,
    },
    {
        title: 'Products',
        href: '/products',
        icon: Package,
    },
    {
        title: 'Orders',
        href: '/orders',
        icon: Book,
    },
    {
        title: 'Temperature',
        href: '/temperature-records',
        icon: Thermometer,
    },
    {
        title: 'Invoices',
        href: '/invoices',
        icon: Paperclip,
    },
];

// Menu Karantina — hanya untuk role_id 4
const karantinaNavItem: NavItem = {
    title: 'Karantina',
    href: '/karantina',
    icon: User, // Ganti dengan ikon yang sesuai jika perlu
};

// Footer tetap sama
const footerNavItems: NavItem[] = [
    // {
    //     title: 'Repository',
    //     href: 'https://github.com/laravel/react-starter-kit',
    //     icon: Folder,
    // },
    // {
    //     title: 'Ada kendala?',
    //     href: 'https://wa.me/6285179995773',
    //     icon: MessageSquareCode,
    // },
];

export function AppSidebar() {
    const { auth } = usePage().props as { auth?: { user?: { role_id: number } } };
    const roleId = auth?.user?.role_id;

    // Tentukan menu yang akan ditampilkan
    let filteredNavItems: NavItem[] = [];

    if (roleId == 1) {
        // Superadmin: semua menu kecuali Karantina (karena hanya untuk role 4)
        filteredNavItems = baseNavItems;
    } else if (roleId == 2) {
        // Admin: tanpa User, Customers, Shippers, Products
        filteredNavItems = baseNavItems.filter((item) => !['/users', '/products'].includes(item.href));
    } else if (roleId == 3) {
        // Checker: hanya Dashboard dan Orders
        filteredNavItems = baseNavItems.filter((item) => item.href == '/dashboard' || item.href == '/orders');
    } else if (roleId == 4) {
        // Karantina: hanya menu Karantina
        filteredNavItems = [karantinaNavItem];
    }
    // Role lain tidak mendapatkan menu apapun (atau bisa ditampilkan halaman kosong / error)

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
